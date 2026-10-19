
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

// Reusable order details
const orderInclude = {
  items: {
    include: {
      listing: {
        select: {
          id: true,
          imageUrl: true,
        },
      },
    },
  },
  buyer: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      phoneNumber: true,
    },
  },
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
  },
};

// Hide buyer phone number until the seller accepts the order.
function sellerSafeOrder(order) {
  if (!order) return order;

  const canContactBuyer = [
    "ACCEPTED",
    "READY_FOR_PICKUP",
  ].includes(order.status);

  return {
    ...order,
    buyer: order.buyer
      ? {
          ...order.buyer,
          phoneNumber: canContactBuyer
            ? order.buyer.phoneNumber
            : null,
        }
      : order.buyer,
  };
}

// Get orders placed by the logged-in buyer
async function getMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.user.id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
      items: {
        include: {
          listing: {
            select: {
              id: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: orders });
}

// Get orders received by the logged-in seller
async function getSellerOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { sellerId: req.user.id },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          phoneNumber: true,
        },
      },
      items: {
        include: {
          listing: {
            select: {
              id: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: orders.map(sellerSafeOrder),
  });
}

// Place orders from the buyer's cart.
// Each listing represents one individual product.
// Quantity is always treated as 1.
async function createOrder(req, res) {
  const { pickupLocation, buyerNote } = req.body;

  if (
    pickupLocation !== undefined &&
    (typeof pickupLocation !== "string" ||
      pickupLocation.trim().length > 200)
  ) {
    throw new HttpError(
      400,
      "Pickup location must be 200 characters or fewer"
    );
  }

  if (
    buyerNote !== undefined &&
    (typeof buyerNote !== "string" ||
      buyerNote.trim().length > 1000)
  ) {
    throw new HttpError(
      400,
      "Buyer note must be 1000 characters or fewer"
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { listing: true },
  });
console.log(
  "ORDER STATUS CHECK:",
  cartItems.map((item) => ({
    title: item.listing?.title,
    status: item.listing?.status,
    listingId: item.listingId,
  }))
);
  if (cartItems.length === 0) {
    throw new HttpError(400, "Your cart is empty");
  }

  if (
    cartItems.some(
      (item) => item.listing.status !== "AVAILABLE"
    )
  ) {
    throw new HttpError(
      400,
      "Some products are no longer available. Please update your cart."
    );
  }

  if (
    cartItems.some(
      (item) => item.listing.sellerId === req.user.id
    )
  ) {
    throw new HttpError(
      400,
      "You cannot order your own listing"
    );
  }

  // Group cart items by seller.
  // Ignore stored cart quantity: each listing is one item.
  const itemsBySeller = new Map();

  for (const item of cartItems) {
    const sellerId = item.listing.sellerId;

    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, []);
    }

    itemsBySeller.get(sellerId).push(item);
  }

  const createdOrders = await prisma.$transaction(
    async (tx) => {
      const orders = [];

      for (const [sellerId, sellerItems] of itemsBySeller) {
        // Each listing contributes its price exactly once.
        const totalAmount = sellerItems.reduce(
          (sum, item) => sum + Number(item.listing.price),
          0
        );

        const order = await tx.order.create({
          data: {
            buyerId: req.user.id,
            sellerId,
            status: "PLACED",
            paymentMethod: "CASH_ON_COLLECTION",
            paymentStatus: "PENDING",
            totalAmount: totalAmount.toFixed(2),
            pickupLocation: pickupLocation?.trim() || null,
            buyerNote: buyerNote?.trim() || null,
            items: {
              create: sellerItems.map((item) => ({
                listingId: item.listingId,
                title: item.listing.title,
                unitPrice: item.listing.price,
                quantity: 1,
              })),
            },
          },
          include: {
            items: {
              include: {
                listing: {
                  select: {
                    id: true,
                    imageUrl: true,
                  },
                },
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Reserve each listing exactly once.
        for (const item of sellerItems) {
          const updated = await tx.listing.updateMany({
            where: {
              id: item.listingId,
              status: "AVAILABLE",
            },
            data: { status: "RESERVED" },
          });

          if (updated.count !== 1) {
            throw new HttpError(
              409,
              "A product is no longer available. Refresh your cart."
            );
          }
        }

        orders.push(order);
      }

      // Clear the buyer's cart after successful order creation.
      await tx.cartItem.deleteMany({
        where: { userId: req.user.id },
      });

      return orders;
    }
  );

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: createdOrders,
  });
}

// Seller accepts or rejects an order
async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    throw new HttpError(
      400,
      "Status must be ACCEPTED or REJECTED"
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, sellerId: req.user.id },
    include: { items: true },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (order.status !== "PLACED") {
    throw new HttpError(
      400,
      "Only newly placed orders can be accepted or rejected"
    );
  }

  const updatedOrder = await prisma.$transaction(
    async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id,
          sellerId: req.user.id,
          status: "PLACED",
        },
        data: {
          status,
          acceptedAt:
            status === "ACCEPTED" ? new Date() : null,
        },
      });

      if (result.count !== 1) {
        throw new HttpError(
          409,
          "This order has already been updated"
        );
      }

      if (status === "REJECTED") {
        for (const item of order.items) {
          await tx.listing.updateMany({
            where: {
              id: item.listingId,
              status: "RESERVED",
            },
            data: { status: "AVAILABLE" },
          });
        }
      }

      return tx.order.findUnique({
        where: { id },
        include: orderInclude,
      });
    }
  );

  res.json({
    success: true,
    message: `Order ${status.toLowerCase()} successfully`,
    data: sellerSafeOrder(updatedOrder),
  });
}

// Seller proposes a pickup date and time
async function proposePickupSchedule(req, res) {
  const { id } = req.params;
  const { pickupScheduledAt, pickupLocation } = req.body;

  if (
    typeof pickupScheduledAt !== "string" ||
    !pickupScheduledAt.trim()
  ) {
    throw new HttpError(
      400,
      "Pickup date and time are required"
    );
  }

  const scheduledDate = new Date(pickupScheduledAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new HttpError(
      400,
      "Please provide a valid pickup date and time"
    );
  }

  if (scheduledDate <= new Date()) {
    throw new HttpError(
      400,
      "Pickup date and time must be in the future"
    );
  }

  if (
    pickupLocation !== undefined &&
    (typeof pickupLocation !== "string" ||
      pickupLocation.trim().length === 0 ||
      pickupLocation.trim().length > 200)
  ) {
    throw new HttpError(
      400,
      "Pickup location must contain 1 to 200 characters"
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, sellerId: req.user.id },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (order.status !== "ACCEPTED" || !order.acceptedAt) {
    throw new HttpError(
      400,
      "Accept the order before proposing a pickup schedule"
    );
  }

  if (order.pickupScheduleStatus === "CONFIRMED") {
    throw new HttpError(
      400,
      "The pickup schedule is already confirmed"
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      pickupScheduledAt: scheduledDate,
      pickupScheduleStatus: "PROPOSED",
      pickupConfirmedAt: null,
      ...(pickupLocation !== undefined
        ? { pickupLocation: pickupLocation.trim() }
        : {}),
    },
    include: orderInclude,
  });

  res.json({
    success: true,
    message: "Pickup schedule proposed to the buyer",
    data: sellerSafeOrder(updatedOrder),
  });
}

// Buyer confirms the seller's proposed pickup schedule
async function confirmPickupSchedule(req, res) {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, buyerId: req.user.id },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (
    order.status !== "ACCEPTED" ||
    order.pickupScheduleStatus !== "PROPOSED" ||
    !order.pickupScheduledAt
  ) {
    throw new HttpError(
      400,
      "There is no proposed pickup schedule to confirm"
    );
  }

  if (order.pickupScheduledAt <= new Date()) {
    throw new HttpError(
      400,
      "This proposed pickup time has passed. Request a new schedule."
    );
  }

  const result = await prisma.order.updateMany({
    where: {
      id,
      buyerId: req.user.id,
      status: "ACCEPTED",
      pickupScheduleStatus: "PROPOSED",
    },
    data: {
      pickupScheduleStatus: "CONFIRMED",
      pickupConfirmedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new HttpError(
      409,
      "The pickup schedule has changed. Refresh the order."
    );
  }

  const updatedOrder = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  res.json({
    success: true,
    message: "Pickup schedule confirmed",
    data: updatedOrder,
  });
}

// Buyer asks the seller to propose another pickup time
async function requestPickupReschedule(req, res) {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, buyerId: req.user.id },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (
    order.status !== "ACCEPTED" ||
    order.pickupScheduleStatus !== "PROPOSED"
  ) {
    throw new HttpError(
      400,
      "You can request a new time only when a pickup schedule is proposed"
    );
  }

  const result = await prisma.order.updateMany({
    where: {
      id,
      buyerId: req.user.id,
      status: "ACCEPTED",
      pickupScheduleStatus: "PROPOSED",
    },
    data: {
      pickupScheduleStatus: "RESCHEDULE_REQUESTED",
      pickupConfirmedAt: null,
    },
  });

  if (result.count !== 1) {
    throw new HttpError(
      409,
      "The pickup schedule has changed. Refresh the order."
    );
  }

  const updatedOrder = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  res.json({
    success: true,
    message: "Reschedule request sent to the seller",
    data: updatedOrder,
  });
}

// Seller marks an accepted order ready for pickup
async function markReadyForPickup(req, res) {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      sellerId: req.user.id,
    },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (order.status !== "ACCEPTED") {
    throw new HttpError(
      400,
      "Only accepted orders can be marked ready for pickup"
    );
  }

  if (order.pickupScheduleStatus !== "CONFIRMED") {
    throw new HttpError(
      400,
      "The buyer must confirm the pickup schedule first"
    );
  }

  const result = await prisma.order.updateMany({
    where: {
      id: order.id,
      sellerId: req.user.id,
      status: "ACCEPTED",
      pickupScheduleStatus: "CONFIRMED",
    },
    data: { status: "READY_FOR_PICKUP" },
  });

  if (result.count !== 1) {
    throw new HttpError(
      409,
      "The order has changed. Refresh and try again."
    );
  }

  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: orderInclude,
  });

  res.json({
    success: true,
    message: "Order marked ready for pickup",
    data: sellerSafeOrder(updatedOrder),
  });
}

// Seller confirms collection and cash payment
async function markCollected(req, res) {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      sellerId: req.user.id,
    },
    include: { items: true },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (order.status !== "READY_FOR_PICKUP") {
    throw new HttpError(
      400,
      "Only orders ready for pickup can be marked collected"
    );
  }

  const updatedOrder = await prisma.$transaction(
    async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: order.id,
          sellerId: req.user.id,
          status: "READY_FOR_PICKUP",
        },
        data: {
          status: "COLLECTED",
          paymentStatus: "PAID",
          collectedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        throw new HttpError(
          409,
          "The order has already been updated"
        );
      }

      for (const item of order.items) {
        await tx.listing.updateMany({
          where: {
            id: item.listingId,
            status: "RESERVED",
          },
          data: { status: "EXCHANGED" },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: orderInclude,
      });
    }
  );

  res.json({
    success: true,
    message: "Order collection confirmed",
    data: sellerSafeOrder(updatedOrder),
  });
}

// Buyer cancels an order while awaiting seller response
async function cancelOrder(req, res) {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      buyerId: req.user.id,
    },
    include: { items: true },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (order.status !== "PLACED") {
    throw new HttpError(
      400,
      "Only orders awaiting seller response can be cancelled"
    );
  }

  const updatedOrder = await prisma.$transaction(
    async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: order.id,
          buyerId: req.user.id,
          status: "PLACED",
        },
        data: { status: "CANCELLED" },
      });

      if (result.count !== 1) {
        throw new HttpError(
          409,
          "The order has already been updated"
        );
      }

      for (const item of order.items) {
        await tx.listing.updateMany({
          where: {
            id: item.listingId,
            status: "RESERVED",
          },
          data: { status: "AVAILABLE" },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: orderInclude,
      });
    }
  );

  res.json({
    success: true,
    message: "Order cancelled successfully",
    data: updatedOrder,
  });
}

module.exports = {
  getMyOrders,
  getSellerOrders,
  createOrder,
  updateOrderStatus,
  proposePickupSchedule,
  confirmPickupSchedule,
  requestPickupReschedule,
  markReadyForPickup,
  markCollected,
  cancelOrder,
};
