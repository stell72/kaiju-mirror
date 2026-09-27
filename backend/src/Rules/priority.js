function sortByXenoPriority(requests) {
    return [...requests].sort((a, b) => {
        const aIsXenoOwn = a.fromQuarterCode === 'X' ? 0 : 1;
        const bIsXenoOwn = b.fromQuarterCode === 'X' ? 0 : 1;
        return aIsXenoOwn - bIsXenoOwn;
    });
}
module.exports = { sortByXenoPriority };