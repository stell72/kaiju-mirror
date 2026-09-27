async function applyTransfer(transferId) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new Error('TRANSFER_NOT_FOUND');
    }
    if (transfer.status !== 'PENDING') {
      throw new Error('TRANSFER_NOT_PENDING');
    }

    const { fromQuarterId, toQuarterId, resourceTypeId, quantity } = transfer;

    const sourceStock = await tx.quarterStock.findUnique({
      where: {
        quarterId_resourceTypeId: { quarterId: fromQuarterId, resourceTypeId },
      },
    });

    if (!sourceStock || sourceStock.currentQuantity < quantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    await tx.quarterStock.update({
      where: {
        quarterId_resourceTypeId: { quarterId: fromQuarterId, resourceTypeId },
      },
      data: { currentQuantity: { decrement: quantity } },
    });


    const destStock = await tx.quarterStock.update({
      where: {
        quarterId_resourceTypeId: { quarterId: toQuarterId, resourceTypeId },
      },
      data: { currentQuantity: { increment: quantity } },
    }).catch((err) => {
      if (err.code === 'P2025') {
        throw new Error('DESTINATION_STOCK_NOT_FOUND');
      }
      throw err;
    });

    const updated = await tx.transferRequest.update({
      where: { id: transferId },
      data: { status: 'COMPLETED' },
    });

    return updated;
  });
}