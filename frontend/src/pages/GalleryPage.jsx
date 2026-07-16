import { useEffect, useMemo, useState, useCallback } from "react";
import GalleryToolbar from "../components/Gallery/GalleryToolbar";
import GalleryGrid from "../components/Gallery/GalleryGrid";
import { GallerySkeleton, EmptyState, ErrorState } from "../components/Gallery/GalleryStates";
import UploadModal from "../components/Gallery/UploadModal";
import PreviewModal from "../components/Gallery/PreviewModal";
import ConfirmDialog from "../components/Shared/ConfirmDialog";
import Toast from "../components/Shared/Toast";
import Pagination from "../components/Shared/Pagination";
import { fetchMedia, uploadMedia, deleteMedia, downloadMedia } from "../api/galleryApi";
import { usePermissions } from "../auth/AuthContext";

export default function GalleryPage() {
  const can = usePermissions();
  const canUpload = can("gallery:upload");
  const canDelete = can("gallery:delete");

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ all: 0, image: 0, video: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 24;

  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const [showUpload, setShowUpload] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type2 = "success") => setToast({ message, type: type2 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMedia({ type, search, sort, page, limit: LIMIT });
      setItems(data.items);
      setCounts(data.counts);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [type, search, sort, page]);

  // Reset page to 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [type, search, sort]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleUpload = async (files, alts, onProgress) => {
    try {
      await uploadMedia(files, alts, onProgress);
      showToast(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || "Upload failed", "error");
      throw err;
    }
  };

  const handleCopyLink = (item) => {
    navigator.clipboard.writeText(item.url);
    showToast("Link copied to clipboard");
  };

  const handleDownload = async (item) => {
    try {
      await downloadMedia(item._id, item.originalName);
    } catch (err) {
      showToast("Download failed", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMedia(pendingDelete._id);
      setItems((prev) => prev.filter((i) => i._id !== pendingDelete._id));
      showToast("File deleted");
      if (previewIndex !== null) setPreviewIndex(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    } finally {
      setPendingDelete(null);
    }
  };

  const hasFilters = search.trim().length > 0 || type !== "all";

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <header className="border-b border-paper-line bg-paper-card px-8 py-6">
        {/* <p className="font-mono text-xs uppercase tracking-wide text-signal">Module 1</p> */}
        <h1 className="font-display text-2xl font-semibold text-ink">Gallery Management</h1>
        <p className="mt-1 text-sm text-muted">Upload, organize, and share images and videos.</p>
      </header>

      <GalleryToolbar
        type={type}
        setType={setType}
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        counts={counts}
        onUploadClick={() => setShowUpload(true)}
        canUpload={canUpload}
      />

      <main className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <GallerySkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onUploadClick={() => setShowUpload(true)}
            onClearFilters={() => {
              setSearch("");
              setType("all");
            }}
            canUpload={canUpload}
          />
        ) : (
          <GalleryGrid
            items={items}
            onPreview={(item) => setPreviewIndex(items.findIndex((i) => i._id === item._id))}
            onCopyLink={handleCopyLink}
            onDownload={handleDownload}
            onDelete={canDelete ? (item) => setPendingDelete(item) : undefined}
          />
        )}
      </main>

      <Pagination
        page={page}
        pages={totalPages}
        total={totalItems}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {showUpload && canUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />}

      {previewIndex !== null && (
        <PreviewModal
          items={items}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
          onCopyLink={handleCopyLink}
          onDownload={handleDownload}
          onDelete={canDelete ? (item) => setPendingDelete(item) : undefined}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this file?"
          description={`"${pendingDelete.originalName}" will be permanently removed. This can't be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
