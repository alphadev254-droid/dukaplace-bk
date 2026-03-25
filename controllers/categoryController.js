const prisma = require("../lib/prisma");
const { ok, created, fail, serverError, slugify } = require("../utils");

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return ok(res, categories);
  } catch (e) { return serverError(res, e, "getCategories"); }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return fail(res, "Name is required");
    const category = await prisma.category.create({
      data: { name, slug: slugify(name), icon: icon || null, description: description || null },
    });
    return created(res, category, "Category created");
  } catch (e) { return serverError(res, e, "createCategory"); }
};
