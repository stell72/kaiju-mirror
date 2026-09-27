
function wouldViolateRetention(currentQuantity, retentionMin, quantityRemoved) {
    return (currentQuantity - quantityRemoved) < retentionMin;
}
module.exports = { wouldViolateRetention };