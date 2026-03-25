const prisma = require("../lib/prisma");
const { ok, created, fail, forbidden, serverError } = require("../utils");

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { lastMessageTime: "desc" },
      include: {
        product: { select: { title: true, images: { take: 1, orderBy: { displayOrder: "asc" } } } },
        buyer:   { select: { id: true, name: true } },
        seller:  { select: { id: true, name: true } },
        messages: {
          where:   { senderId: { not: userId }, isRead: false },
          select:  { id: true },
        },
      },
    });

    const data = conversations.map((c) => ({
      id:              c.id,
      productId:       c.productId,
      productTitle:    c.product?.title || "Product Deleted",
      productImage:    c.product?.images?.[0]?.url || null,
      buyerId:         c.buyerId,
      buyerName:       c.buyer?.name  || "Unknown",
      sellerId:        c.sellerId,
      sellerName:      c.seller?.name || "Unknown",
      lastMessage:     c.lastMessage,
      lastMessageTime: c.lastMessageTime,
      unreadCount:     c.messages.length,
      createdAt:       c.createdAt,
    }));

    return ok(res, data);
  } catch (e) { return serverError(res, e, "getConversations"); }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    });
    if (!conv) return forbidden(res, "Access denied");

    const messages = await prisma.message.findMany({
      where:   { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { name: true } } },
    });

    // Mark unread as read
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data:  { isRead: true },
    });

    const data = messages.map((m) => ({
      id:             m.id,
      conversationId: m.conversationId,
      senderId:       m.senderId,
      senderName:     m.sender?.name,
      text:           m.message,
      isRead:         m.isRead,
      timestamp:      m.createdAt,
    }));

    return ok(res, data);
  } catch (e) { return serverError(res, e, "getMessages"); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { productId, receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message || !productId)
      return fail(res, "productId, receiverId and message are required");

    // Determine buyer/seller
    const product  = await prisma.product.findUnique({ where: { id: productId } });
    const sellerId = product ? product.sellerId : receiverId;
    const buyerId  = senderId === sellerId ? receiverId : senderId;

    // Get or create conversation
    let conv = await prisma.conversation.findFirst({
      where: { productId, buyerId, sellerId },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: { productId, buyerId, sellerId, lastMessage: message },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conv.id },
        data:  { lastMessage: message, lastMessageTime: new Date() },
      });
    }

    const newMessage = await prisma.message.create({
      data:    { conversationId: conv.id, senderId, message },
      include: { sender: { select: { name: true } } },
    });

    return created(res, {
      message: {
        id:             newMessage.id,
        conversationId: newMessage.conversationId,
        senderId:       newMessage.senderId,
        senderName:     newMessage.sender?.name,
        text:           newMessage.message,
        isRead:         newMessage.isRead,
        timestamp:      newMessage.createdAt,
      },
      conversationId: conv.id,
    }, "Message sent");
  } catch (e) { return serverError(res, e, "sendMessage"); }
};
