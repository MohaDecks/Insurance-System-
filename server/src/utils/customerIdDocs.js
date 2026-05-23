/** Max ID scans per customer (passport / license / dhalasho pages, etc.) */
export const MAX_ID_DOCUMENTS = 8;

export function idDocumentPublicPath(customerId, fileId) {
  return `/uploads/customers/${String(customerId)}/${fileId}`;
}

/** Adds `url` to each idDocument for JSON responses (Mongoose doc or plain object). */
export function attachCustomerIdDocUrls(doc) {
  if (!doc) return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const cid = String(plain._id);
  plain.idDocuments = (plain.idDocuments || []).map((d) => ({
    ...d,
    url: idDocumentPublicPath(cid, d.fileId),
  }));
  return plain;
}
