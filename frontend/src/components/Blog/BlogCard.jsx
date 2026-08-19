import { Link } from "react-router-dom";
import { Clock, Pencil, Trash2, ImageOff } from "lucide-react";
import { Avatar } from "../Users/Badges";

function ScoreBadge({ score }) {
  const color = score >= 90 ? "bg-success/10 text-success" : score >= 70 ? "bg-signal-soft text-signal" : score >= 50 ? "bg-flare/10 text-flare" : "bg-danger/10 text-danger";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>SEO {score}</span>;
}

export default function BlogCard({ post, onDelete, canEdit, canDelete }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-paper-line bg-paper-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <Link to={`/blog/${post._id}/edit`} className="relative block aspect-[16/9] overflow-hidden bg-ink/5">
        {post.featuredImage?.url ? (
          <img src={post.featuredImage.url} alt={post.featuredImage.alt || post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff size={24} />
          </div>
        )}
        <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${post.status === "published" ? "bg-success text-white" : "bg-ink/70 text-white"}`}>
          {post.status}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          {post.category && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}>
              {post.category.name}
            </span>
          )}
          <ScoreBadge score={post.seoScore} />
        </div>

        <Link to={`/blog/${post._id}/edit`}>
          <h3 className="font-display text-sm font-semibold leading-snug text-ink line-clamp-2 hover:text-signal">{post.title}</h3>
        </Link>


        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Avatar name={post.author?.name} color={post.author?.avatarColor} avatarUrl={post.author?.avatarUrl} size={22} />
            <span className="text-xs text-muted">{post.author?.name}</span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted">
            <Clock size={11} />
            {post.readingTimeMinutes} min
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-paper-line px-4 py-2.5">
        {canEdit && (
          <Link to={`/blog/${post._id}/edit`} className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
            <Pencil size={13} /> Edit
          </Link>
        )}
        {canDelete && (
          <button onClick={() => onDelete(post)} className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted hover:text-danger">
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
