import { useEffect, useState } from 'react'
import PlanGate from '../../components/common/PlanGate.jsx'
import RevenueCard from '../../components/reports/RevenueCard.jsx'
import TopProducts from '../../components/reports/TopProducts.jsx'
import reportService from '../../services/reportService'

export default function Reports() {
	const [data, setData] = useState({ revenue: 0, sales: 0, topProducts: [] })

	useEffect(() => {
		reportService.getSummary().then(setData).catch(() => {})
	}, [])

	return (
		<PlanGate feature="reports">
			<div className="grid">
				<RevenueCard revenue={data.revenue} sales={data.sales} />
				<TopProducts items={data.topProducts} />
			</div>
		</PlanGate>
	)
}
