
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

const listingInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      department: true,
      year: true,
      college: true,
    },
  },
  category: true,
};

// Normalize text for keyword matching.
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

// Match a wanted item against a new listing.
// Title keywords are weighted more heavily than description keywords.
function matchesWantedItem(wantedItem, listing) {
  const wantedTitleWords = normalizeText(wantedItem.title);
  const listingTitleWords = normalizeText(listing.title);

  const wantedDescriptionWords = normalizeText(
    wantedItem.description
  );
  const listingDescriptionWords = normalizeText(
    listing.description
  );

  const listingWords = new Set([
    ...listingTitleWords,
    ...listingDescriptionWords,
  ]);

  const wantedWords = new Set([
    ...wantedTitleWords,
    ...wantedDescriptionWords,
  ]);

  const titleMatches = wantedTitleWords.filter((word) =>
    listingWords.has(word)
  ).length;

  const descriptionMatches = wantedDescriptionWords.filter((word) =>
    listingWords.has(word)
  ).length;

  const listingTitleMatches = listingTitleWords.filter((word) =>
    wantedWords.has(word)
  ).length;

  // Require at least one meaningful title keyword match.
  const hasTitleMatch =
    titleMatches > 0 || listingTitleMatches > 0;

  if (!hasTitleMatch) {
    return false;
  }

  // If a maximum budget was specified, do not notify for
  // listings that exceed it.
  if (
    wantedItem.maxPrice != null &&
    Number(listing.price) > Number(wantedItem.maxPrice)
  ) {
    return false;
  }

  // Require sufficient overlap to avoid unrelated notifications.
  return titleMatches + descriptionMatches >= 1;
}

async function createWantedItemNotifications(listing) {
  const wantedItems = await prisma.wantedItem.findMany({
    where: {
      userId: {
        not: listing.sellerId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          college: true,
        },
      },
    },
  });

  const matchingItems = wantedItems.filter((wantedItem) =>
    matchesWantedItem(wantedItem, listing)
  );

  if (matchingItems.length === 0) {
    return;
  }

  // Avoid sending duplicate notifications for the same
  // user, listing, and wanted item combination.
  await prisma.notification.createMany({
    data: matchingItems.map((wantedItem) => ({
      userId: wantedItem.userId,
      listingId: listing.id,
      wantedItemId: wantedItem.id,
      type: "WANTED_ITEM_MATCH",
      title: "A product matching your wanted item is available",
      message: `"${listing.title}" matches your request "${wantedItem.title}".`,
    })),
    skipDuplicates: true,
  });
}

async function getListings(req, res) {
  const page = Math.max(
    1,
    Number.parseInt(req.query.page || "1", 10) || 1
  );

  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit || "12", 10) || 12)
  );

  const skip = (page - 1) * limit;

  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const where = {
    status: "AVAILABLE",
  };

  // Hide the logged-in user's own listings from the Marketplace.
  if (req.user?.id) {
    where.sellerId = {
      not: req.user.id,
    };
  }

  if (req.query.categoryId) {
    where.categoryId = String(req.query.categoryId);
  }

  if (
    req.query.condition &&
    ["NEW", "LIKE_NEW", "GOOD", "FAIR"].includes(
      req.query.condition
    )
  ) {
    where.condition = req.query.condition;
  }

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (req.query.minPrice || req.query.maxPrice) {
    where.price = {};

    if (
      req.query.minPrice &&
      Number.isFinite(Number(req.query.minPrice))
    ) {
      where.price.gte = Number(req.query.minPrice);
    }

    if (
      req.query.maxPrice &&
      Number.isFinite(Number(req.query.maxPrice))
    ) {
      where.price.lte = Number(req.query.maxPrice);
    }
  }

  const college =
    typeof req.user?.college === "string"
      ? req.user.college.trim()
      : "";

  if (!req.user || !college) {
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return res.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  const sameCollegeWhere = {
    ...where,
    seller: {
      is: { college },
    },
  };

  const otherCollegeWhere = {
    ...where,
    AND: [
      {
        OR: [
          {
            seller: {
              is: {
                college: { not: college },
              },
            },
          },
          {
            seller: {
              is: { college: null },
            },
          },
        ],
      },
    ],
  };

  const [sameCollegeTotal, otherCollegeTotal] = await Promise.all([
    prisma.listing.count({ where: sameCollegeWhere }),
    prisma.listing.count({ where: otherCollegeWhere }),
  ]);

  const sameCollegeSkip = Math.min(skip, sameCollegeTotal);

  const sameCollegeTake = Math.min(
    limit,
    Math.max(0, sameCollegeTotal - skip)
  );

  const otherCollegeSkip = Math.max(0, skip - sameCollegeTotal);
  const otherCollegeTake = limit - sameCollegeTake;

  const [sameCollegeListings, otherCollegeListings] =
    await Promise.all([
      sameCollegeTake > 0
        ? prisma.listing.findMany({
            where: sameCollegeWhere,
            include: listingInclude,
            orderBy: { createdAt: "desc" },
            skip: sameCollegeSkip,
            take: sameCollegeTake,
          })
        : Promise.resolve([]),

      otherCollegeTake > 0
        ? prisma.listing.findMany({
            where: otherCollegeWhere,
            include: listingInclude,
            orderBy: { createdAt: "desc" },
            skip: otherCollegeSkip,
            take: otherCollegeTake,
          })
        : Promise.resolve([]),
    ]);

  const listings = [
    ...sameCollegeListings,
    ...otherCollegeListings,
  ];

  const total = sameCollegeTotal + otherCollegeTotal;

  return res.json({
    success: true,
    data: listings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getMyListings(req, res) {
  const listings = await prisma.listing.findMany({
    where: {
      sellerId: req.user.id,
    },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    count: listings.length,
    data: listings,
  });
}

async function getListingById(req, res) {
  const listing = await prisma.listing.findUnique({
    where: {
      id: req.params.id,
    },
    include: listingInclude,
  });

  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }

  res.json({
    success: true,
    data: listing,
  });
}

async function createListing(req, res) {
  const {
    title,
    description,
    price,
    condition,
    categoryId,
  } = req.body;

  const imageUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : req.body.imageUrl || null;

  if (
    !title ||
    !description ||
    price == null ||
    !condition ||
    !categoryId
  ) {
    throw new HttpError(
      400,
      "Title, description, price, condition, and categoryId are required"
    );
  }

  if (!String(title).trim() || !String(description).trim()) {
    throw new HttpError(
      400,
      "Title and description cannot be empty"
    );
  }

  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new HttpError(
      400,
      "Price must be a valid non-negative number"
    );
  }

  if (!["NEW", "LIKE_NEW", "GOOD", "FAIR"].includes(condition)) {
    throw new HttpError(400, "Invalid item condition");
  }

  const category = await prisma.category.findUnique({
    where: {
      id: String(categoryId),
    },
  });

  if (!category) {
    throw new HttpError(400, "Selected category does not exist");
  }

  const listing = await prisma.listing.create({
    data: {
      title: String(title).trim(),
      description: String(description).trim(),
      price: amount,
      condition,
      imageUrl,
      sellerId: req.user.id,
      categoryId: String(categoryId),
    },
    include: listingInclude,
  });

  // Notification failure should not make a successfully created
  // listing appear to have failed. Log the error for debugging.
  try {
    await createWantedItemNotifications(listing);
  } catch (error) {
    console.error("Wanted-item notification creation failed:", error);
  }

  res.status(201).json({
    success: true,
    data: listing,
  });
}

async function updateListing(req, res) {
  const existing = await prisma.listing.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!existing) {
    throw new HttpError(404, "Listing not found");
  }

  if (
    existing.sellerId !== req.user.id &&
    req.user.role !== "ADMIN"
  ) {
    throw new HttpError(
      403,
      "You can update only your own listings"
    );
  }

  const data = {};

  for (const field of ["title", "description", "imageUrl"]) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  }

  if (req.body.price !== undefined) {
    const amount = Number(req.body.price);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new HttpError(
        400,
        "Price must be a valid non-negative number"
      );
    }

    data.price = amount;
  }

  if (req.body.condition !== undefined) {
    if (!["NEW", "LIKE_NEW", "GOOD", "FAIR"].includes(req.body.condition)) {
      throw new HttpError(400, "Invalid item condition");
    }

    data.condition = req.body.condition;
  }

  if (req.body.status !== undefined) {
    if (
      ![
        "AVAILABLE",
        "RESERVED",
        "EXCHANGED",
        "REMOVED",
      ].includes(req.body.status)
    ) {
      throw new HttpError(400, "Invalid listing status");
    }

    data.status = req.body.status;
  }

  if (req.body.categoryId !== undefined) {
    data.categoryId = String(req.body.categoryId);
  }

  const listing = await prisma.listing.update({
    where: {
      id: existing.id,
    },
    data,
    include: listingInclude,
  });

  res.json({
    success: true,
    data: listing,
  });
}


async function deleteListing(req, res) {
  const existing = await prisma.listing.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!existing) {
    throw new HttpError(404, "Listing not found");
  }

  if (
    existing.sellerId !== req.user.id &&
    req.user.role !== "ADMIN"
  ) {
    throw new HttpError(
      403,
      "You can delete only your own listings"
    );
  }

  if (existing.status !== "AVAILABLE") {
    throw new HttpError(
      400,
      "Only available listings can be deleted"
    );
  }

  await prisma.listing.delete({
    where: {
      id: existing.id,
    },
  });

  return res.json({
    success: true,
    message: "Listing deleted successfully",
  });
}


module.exports = {
  getListings,
  getMyListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
};
