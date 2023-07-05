// 두 점 X(1), Y(2)의 거리가 dist(distance)보다 가까운지 확인하는 함수
function getIncluded(latX, lonX, latY, lonY, dist) {
	const [C, D] = [Math.cos(((latX + latY) / 2) * 0.0174533) * 111.19, 111.19]; // 경도 1도, 위도 1도에 따른 km값
	if (Math.abs(latX - latY) * D > dist || Math.abs(lonX - lonY) * C > dist)
		return false;

	// 소수점으로 표현된 좌표를 도분초 형식으로 변경
	class DMS {
		constructor(coordinate) {
			(this.D = Math.floor(coordinate)),
				(this.M = Math.floor((coordinate - this.D) * 60)),
				(this.S =
					Math.round(((coordinate - this.D) * 60 - this.M) * 60 * 100) / 100);
		}
	}
	const [X1, Y1, X2, Y2] = [
		new DMS(latX),
		new DMS(lonX),
		new DMS(latY),
		new DMS(lonY),
	];
	const X = {
		D: X1.D - X2.D,
		M: X1.M - X2.M,
		S: Math.floor((X1.S - X2.S) * 100) / 100,
	};
	const Y = {
		D: Y1.D - Y2.D,
		M: Y1.M - Y2.M,
		S: Math.floor((Y1.S - Y2.S) * 100) / 100,
	};
	// 두점 사이의 거리 구하는 공식
	const distance = Math.sqrt(
		(X.D * D + (X.M * D) / 60 + (X.S * D) / 3600) ** 2 +
			(Y.D * C + (Y.M * C) / 60 + (Y.S * C) / 3600) ** 2
	);
	return distance <= dist ? true : false;
}

module.exports = getIncluded;
