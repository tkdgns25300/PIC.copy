// 부분집합 여부 확인하는 함수
function isSubsetOf(base, sample) {
	base.sort();
	sample.sort();
	const findItemInSortedArr = (item, arr, from) => {
		for (let i = from; i < arr.length; i++) {
			if (item === arr[i]) return i;
		}
		return -1;
	};

	let baseIdx = 0;
	for (let i = 0; i < sample.length; i++) {
		baseIdx = findItemInSortedArr(sample[i], base, baseIdx);
		if (baseIdx === -1) {
			return false;
		}
	}
	return true;
}

module.exports = isSubsetOf;
