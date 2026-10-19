
export default function ProductCard({ item }) {
  return (
    <article className="listing-card">
      <div className="listing-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} />
        ) : (
          <span>📦</span>
        )}

        <span className="condition">
          {item.condition?.replaceAll("_", " ")}
        </span>
      </div>

      <div className="listing-info">
        <span className="category-label">
          {item.category?.name || "Campus item"}
        </span>

        <h3>{item.title}</h3>

        <p className="description">{item.description}</p>

        <div className="listing-footer">
          <strong>
            ₹{Number(item.price).toLocaleString("en-IN")}
          </strong>

          <span>👤 {item.seller?.name || "Student"}</span>
        </div>
      </div>
    </article>
  );
}
