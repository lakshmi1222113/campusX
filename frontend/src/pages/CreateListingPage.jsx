
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { createListing } from "../services/listingService";
import "./CreateListingPage.css";

const initialForm = {
  title: "",
  description: "",
  price: "",
  condition: "GOOD",
  categoryId: "",
  imageUrl: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CreateListingPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await apiRequest("/categories");
        setCategories(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (err) {
        setError(err.message || "Unable to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "imageUrl") {
      setImageError(false);
    }

    setError("");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      setImageFile(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setForm((current) => ({
      ...current,
      imageUrl: "",
    }));
    setImageError(false);
  }

  function goToMarketplace() {
    navigate("/marketplace", { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim()) {
      setError("Please enter the product title and description.");
      return;
    }

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      setError("Please enter a valid price greater than zero.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createListing({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        condition: form.condition,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl.trim() || null,
        imageFile,
      });

      const createdListing = response.data;

      if (!createdListing?.id) {
        throw new Error(
          "Listing was created, but its ID was not returned."
        );
      }

      navigate(`/listings/${createdListing.id}`);
    } catch (err) {
      setError(err.message || "Unable to create listing.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLoginError = /log in|login|unauthorized|401/i.test(error);

  return (
    <div className="create-listing-page">
      <header className="create-listing-header">
        <div className="create-listing-header-inner">
          <Link to="/marketplace" className="create-listing-brand">
            <span className="create-listing-brand-mark">C</span>
            CampusX
          </Link>

          <button
            type="button"
            className="create-listing-back"
            onClick={goToMarketplace}
          >
            ← Back to Marketplace
          </button>
        </div>
      </header>

      <main className="create-listing-container">
        <div style={{ marginBottom: 28 }}>
          <p className="create-listing-eyebrow">SELL ON CAMPUSX</p>
          <h1 className="create-listing-title">Create your listing</h1>
          <p className="create-listing-subtitle">
            Share your product with students on your campus.
          </p>
        </div>

        {error && (
          <div className="create-listing-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {isLoginError && (
          <div className="create-listing-login-prompt">
            <p>Please log in to continue.</p>
            <Link to="/login" className="create-listing-login-button">
              Log in to CampusX →
            </Link>
          </div>
        )}

        <div className="create-listing-layout">
          <section className="create-listing-panel">
            <div className="create-listing-form-heading">
              <h2 className="create-listing-panel-title">
                Product information
              </h2>
              <p className="create-listing-muted">
                Provide accurate details to help buyers.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="create-listing-field">
                <label className="create-listing-label" htmlFor="title">
                  Product title{" "}
                  <span className="create-listing-required">*</span>
                </label>
                <input
                  className="create-listing-input"
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. HP laptop charger"
                  required
                  maxLength={120}
                />
                <p className="create-listing-hint">
                  Use a short, clear product name.
                </p>
              </div>

              <div className="create-listing-field">
                <label
                  className="create-listing-label"
                  htmlFor="description"
                >
                  Description{" "}
                  <span className="create-listing-required">*</span>
                </label>
                <textarea
                  className="create-listing-textarea"
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the product, features and any defects..."
                  required
                  rows={5}
                />
              </div>

              <div className="create-listing-two-columns">
                <div className="create-listing-field">
                  <label className="create-listing-label" htmlFor="price">
                    Price (₹){" "}
                    <span className="create-listing-required">*</span>
                  </label>
                  <input
                    className="create-listing-input"
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="650"
                    required
                  />
                </div>

                <div className="create-listing-field">
                  <label
                    className="create-listing-label"
                    htmlFor="condition"
                  >
                    Condition
                  </label>
                  <select
                    className="create-listing-select"
                    id="condition"
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                  >
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>
              </div>

              <div className="create-listing-field">
                <label
                  className="create-listing-label"
                  htmlFor="categoryId"
                >
                  Category{" "}
                  <span className="create-listing-required">*</span>
                </label>
                <select
                  className="create-listing-select"
                  id="categoryId"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Choose a category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="create-listing-field">
                <label
                  className="create-listing-label"
                  htmlFor="imageFile"
                >
                  Upload product image (optional)
                </label>
                <input
                  className="create-listing-input"
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
                <p className="create-listing-hint">
                  JPG, PNG or WEBP. Maximum size: 5 MB.
                </p>

                {imagePreview && (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={imagePreview}
                      alt="Selected product preview"
                      style={{
                        width: "100%",
                        maxWidth: 260,
                        maxHeight: 220,
                        objectFit: "contain",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <button
                      type="button"
                      className="create-listing-cancel"
                      style={{ display: "block", marginTop: 8 }}
                      onClick={() => {
                        setImageFile(null);
                        const input = document.getElementById("imageFile");
                        if (input) input.value = "";
                      }}
                    >
                      Remove selected image
                    </button>
                  </div>
                )}
              </div>

              <div className="create-listing-field">
                <label
                  className="create-listing-label"
                  htmlFor="imageUrl"
                >
                  Or use an image URL
                </label>
                <input
                  className="create-listing-input"
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) => {
                    handleChange(event);
                    if (event.target.value) {
                      setImageFile(null);
                      const input = document.getElementById("imageFile");
                      if (input) input.value = "";
                    }
                  }}
                  placeholder="https://example.com/product.jpg"
                />
                <p className="create-listing-hint">
                  Uploading a file is recommended. Alternatively, use a
                  publicly accessible image URL.
                </p>
              </div>

              <div className="create-listing-actions">
                <button
                  className="create-listing-submit"
                  type="submit"
                  disabled={submitting || loadingCategories}
                >
                  {submitting ? "Publishing..." : "Publish listing →"}
                </button>

                <button
                  type="button"
                  className="create-listing-cancel"
                  onClick={goToMarketplace}
                >
                  Cancel
                </button>
              </div>

              <p
                className="create-listing-hint"
                style={{ marginTop: 16 }}
              >
                Please make sure your product information is accurate.
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
