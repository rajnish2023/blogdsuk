 

const PERMISSIONS = [
  { key: "gallery:view", module: "Gallery", action: "View", description: "View images and videos in the gallery" },
  { key: "gallery:upload", module: "Gallery", action: "Upload", description: "Upload new images or videos" },
  { key: "gallery:delete", module: "Gallery", action: "Delete", description: "Delete files from the gallery" },

  { key: "users:view", module: "Users", action: "View", description: "View team members" },
  { key: "users:create", module: "Users", action: "Create", description: "Invite new team members" },
  { key: "users:edit", module: "Users", action: "Edit", description: "Edit team member details and roles" },
  { key: "users:delete", module: "Users", action: "Delete", description: "Remove team members" },

  { key: "roles:view", module: "Roles", action: "View", description: "View roles and permissions" },
  { key: "roles:manage", module: "Roles", action: "Manage", description: "Create, edit, and delete roles" },

  { key: "blog:view", module: "Blog", action: "View", description: "View blog posts" },
  { key: "blog:create", module: "Blog", action: "Create", description: "Create new blog posts" },
  { key: "blog:edit", module: "Blog", action: "Edit", description: "Edit existing blog posts" },
  { key: "blog:delete", module: "Blog", action: "Delete", description: "Delete blog posts" },
  { key: "blog:publish", module: "Blog", action: "Publish", description: "Publish or unpublish blog posts" },

  { key: "pages:view", module: "Pages", action: "View", description: "View webpages" },
  { key: "pages:create", module: "Pages", action: "Create", description: "Create new webpages" },
  { key: "pages:edit", module: "Pages", action: "Edit", description: "Edit existing webpages" },
  { key: "pages:delete", module: "Pages", action: "Delete", description: "Delete webpages" },
  { key: "pages:publish", module: "Pages", action: "Publish", description: "Publish or unpublish webpages" },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

module.exports = { PERMISSIONS, PERMISSION_KEYS };
