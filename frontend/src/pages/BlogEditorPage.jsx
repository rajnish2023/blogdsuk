import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Send, Pencil } from "lucide-react";
import TipTapEditor from "../components/Blog/TipTapEditor";
import SeoPanel from "../components/Blog/SeoPanel";
import SchemaMarkupPanel from "../components/Blog/SchemaMarkupPanel";
import AuthorSelect from "../components/Blog/AuthorSelect";
import TagInput from "../components/Blog/TagInput";
import FeaturedImagePicker from "../components/Blog/FeaturedImagePicker";
import FaqSection from "../components/Blog/FaqSection";
import Toast from "../components/Shared/Toast";
import { fetchBlog, createBlog, updateBlog, setBlogStatus } from "../api/blogApi";
import { fetchCategories } from "../api/categoryApi";
import { fetchAuthors } from "../api/userApi";
import { slugify } from "../utils/slugify";
import { usePermissions } from "../auth/AuthContext";

const emptySeo = { metaTitle: "", metaDescription: "", focusKeyword: "" };

export default function BlogEditorPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const can = usePermissions();
  const canPublish = can("blog:publish");
  const canReassignAuthor = can("blog:edit");

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [currentAuthor, setCurrentAuthor] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState("draft");
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    featuredImage: null,
    author: "",
    schemaMarkup: [],
    faqs: [],
    seo: emptySeo,
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    if (canReassignAuthor) fetchAuthors().then(setAuthors).catch(() => {});
  }, [canReassignAuthor]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const blog = await fetchBlog(id);
        setForm({
          title: blog.title,
          slug: blog.slug,
          content: blog.content,
          excerpt: blog.excerpt,
          category: blog.category?._id || "",
          tags: blog.tags || [],
          featuredImage: blog.featuredImage?.url ? blog.featuredImage : null,
          author: blog.author?._id || blog.author?.id || "",
          schemaMarkup: blog.schemaMarkup || [],
          faqs: blog.faqs || [],
          seo: { metaTitle: blog.seo?.metaTitle || "", metaDescription: blog.seo?.metaDescription || "", focusKeyword: blog.seo?.focusKeyword || "" },
        });
        setCurrentAuthor(blog.author);
        setStatus(blog.status);
        setSlugTouched(true);
      } catch (err) {
        showToast("Failed to load post", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
  };

  const buildPayload = (targetStatus) => ({
    title: form.title,
    slug: form.slug,
    content: form.content,
    excerpt: form.excerpt,
    category: form.category || null,
    tags: form.tags,
    featuredImage: form.featuredImage,
    seo: form.seo,
    schemaMarkup: form.schemaMarkup,
    faqs: form.faqs,
    status: targetStatus,
    ...(isEdit && canReassignAuthor && form.author ? { author: form.author } : {}),
  });

  const handleSave = async (targetStatus) => {
    if (!form.title.trim()) {
      showToast("Give your post a title first", "error");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const blog = await updateBlog(id, buildPayload(targetStatus));
        if (targetStatus !== status && canPublish) {
          await setBlogStatus(id, targetStatus);
        }
        setStatus(blog.status);
        setCurrentAuthor(blog.author);
        showToast(targetStatus === "published" ? "Post published" : "Draft saved");
      } else {
        const blog = await createBlog(buildPayload(targetStatus));
        showToast(blog.status === "published" ? "Post published" : "Draft saved");
        navigate(`/blog/${blog._id}/edit`, { replace: true });
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save post", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-1 items-center justify-center">
        <Loader2 size={22} className="animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-paper-line bg-paper-card px-8 py-4">
        <div className="flex items-center gap-3">
          <Link to="/blog" className="rounded-md p-2 text-muted hover:bg-paper hover:text-ink">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-signal">{isEdit ? "Edit post" : "New post"}</p>
            <h1 className="font-display text-lg font-semibold text-ink">{form.title || "Untitled post"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${status === "published" ? "bg-success/10 text-success" : "bg-ink/10 text-muted"}`}>
            {status}
          </span>
          <button onClick={() => handleSave("draft")} disabled={saving} className="btn-secondary disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save draft
          </button>
          {canPublish && (
            <button onClick={() => handleSave("published")} disabled={saving} className="btn-primary disabled:opacity-60">
              <Send size={16} />
              {status === "published" ? "Update & keep live" : "Publish"}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card">
              <input
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Post title"
                className="w-full border-none bg-transparent font-display text-2xl font-semibold text-ink placeholder:text-muted/50 focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <span>dynamicssquare.com/blog/</span>
                <div className="group relative flex items-center gap-1">
                  <input
                    value={form.slug}
                    onChange={handleSlugChange}
                    className="w-auto min-w-[80px] rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-xs text-signal focus:border-paper-line focus:bg-paper focus:outline-none"
                    style={{ width: `${Math.max(form.slug.length, 8)}ch` }}
                  />
                  <Pencil size={10} className="opacity-0 group-hover:opacity-60" />
                </div>
              </div>
            </div>

            <TipTapEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />

            <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card">
              <label className="mb-1.5 block text-xs font-medium text-muted">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={3}
                maxLength={300}
                placeholder="Short summary shown in post listings — auto-generated from content if left blank"
                className="w-full resize-none rounded-lg border border-paper-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-signal"
              />
            </div>

            <FaqSection
              faqs={form.faqs}
              onChange={(faqs) => setForm((f) => ({ ...f, faqs }))}
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card">
              <label className="mb-1.5 block text-xs font-medium text-muted">Featured image</label>
              <FeaturedImagePicker image={form.featuredImage} onChange={(img) => setForm((f) => ({ ...f, featuredImage: img }))} />
            </div>

            {isEdit && canReassignAuthor && authors.length > 0 && (
              <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card">
                <label className="mb-1.5 block text-xs font-medium text-muted">Author</label>
                <AuthorSelect
                  authors={authors}
                  value={form.author}
                  currentAuthor={currentAuthor}
                  onChange={(author) => setForm((f) => ({ ...f, author }))}
                />
                <p className="mt-2 text-xs text-muted">Reassigning takes effect the next time you save.</p>
              </div>
            )}

            <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card">
              <label className="mb-1.5 block text-xs font-medium text-muted">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-paper-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-signal"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="mb-1.5 mt-4 block text-xs font-medium text-muted">Tags</label>
              <TagInput tags={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
            </div>

            <SeoPanel
              title={form.seo.metaTitle || form.title}
              content={form.content}
              slug={form.slug}
              seo={form.seo}
              onSeoChange={(seo) => setForm((f) => ({ ...f, seo }))}
            />

            <SchemaMarkupPanel entries={form.schemaMarkup} onChange={(schemaMarkup) => setForm((f) => ({ ...f, schemaMarkup }))} />
          </div>
        </div>
      </main>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
