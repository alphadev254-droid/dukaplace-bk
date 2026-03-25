const prisma = require("../lib/prisma");
const { ok, created, fail, notFound, forbidden, serverError } = require("../utils");

const SELLER_TRANSITIONS = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped",   "cancelled"],
  shipped:   ["cancelled"],
};

const BUYER_TRANSITIONS = {
  shipped:   ["delivered"],
  pending:   ["cancelled"],
  confirmed: ["cancelled"],
};

exports.createOrder = async (req, res) => {
  try {
    const { productId, amount, paymentMethod, deliveryAddress } = req.body;
    if (!productId || !amount) return fail(res, "productId and amount are required");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product)                      return notFound(res, "Product not found");
    if (product.status !== "active")   return fail(res, "Product is not available");
    if (product.sellerId === req.user.id) return fail(res, "You cannot buy your own product");

    await prisma.order.create({
      data: {
        productId,
        buyerId:         req.user.id,
        sellerId:        product.sellerId,
        amount:          parseFloat(amount),
        paymentMethod:   paymentMethod   || null,
        deliveryAddress: deliveryAddress || null,
      },
    });

    return created(res, null, "Order created successfully");
  } catch (e) { return serverError(res, e, "createOrder"); }
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { buyerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { title: true, images: { take: 1, orderBy: { displayOrder: "asc" } } } },
        seller:  { select: { name: true, phone: true } },
      },
    });

    const data = orders.map((o) => ({
      id:              o.id,
      productId:       o.productId,
      productTitle:    o.product?.title || "Product Deleted",
      productImage:    o.product?.images?.[0]?.url || null,
      sellerId:        o.sellerId,
      sellerName:      o.seller?.name  || "Unknown",
      sellerPhone:     o.seller?.phone || null,
      totalAmount:     parseFloat(o.amount),
      status:          o.status,
      paymentMethod:   o.paymentMethod,
      deliveryAddress: o.deliveryAddress,
      createdAt:       o.createdAt,
      updatedAt:       o.updatedAt,
    }));

    return ok(res, data);
  } catch (e) { return serverError(res, e, "getBuyerOrders"); }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { sellerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { title: true, images: { take: 1, orderBy: { displayOrder: "asc" } } } },
        buyer:   { select: { name: true, phone: true } },
      },
    });

    const data = orders.map((o) => ({
      id:              o.id,
      productId:       o.productId,
      productTitle:    o.product?.title || "Product Deleted",
      productImage:    o.product?.images?.[0]?.url || null,
      buyerId:         o.buyerId,
      buyerName:       o.buyer?.name  || "Unknown",
      buyerPhone:      o.buyer?.phone || null,
      totalAmount:     parseFloat(o.amount),
      status:          o.status,
      paymentMethod:   o.paymentMethod,
      deliveryAddress: o.deliveryAddress,
      createdAt:       o.createdAt,
      updatedAt:       o.updatedAt,
    }));

    return ok(res, data);
  } catch (e) { return serverError(res, e, "getSellerOrders"); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status }  = req.body;
    if (!status) return fail(res, "status is required");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return notFound(res, "Order not found");

    if (req.user.role === "admin") {
      await prisma.order.update({ where: { id: orderId }, data: { status } });
      return ok(res, null, "Order status updated");
    }

    const isSeller = order.sellerId === req.user.id;
    const isBuyer  = order.buyerId  === req.user.id;
    if (!isSeller && !isBuyer) return forbidden(res);

    const allowed = isSeller
      ? SELLER_TRANSITIONS[order.status] || []
      : BUYER_TRANSITIONS[order.status]  || [];

    if (!allowed.includes(status)) {
      return fail(res,
        isSeller
          ? `Seller cannot change status from '${order.status}' to '${status}'`
          : `Buyer cannot change status from '${order.status}' to '${status}'`
      );
    }

    await prisma.order.update({ where: { id: orderId }, data: { status } });
    return ok(res, null, "Order status updated");
  } catch (e) { return serverError(res, e, "updateOrderStatus"); }
};
