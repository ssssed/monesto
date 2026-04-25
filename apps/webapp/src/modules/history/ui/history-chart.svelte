<script lang="ts">
	import type { ScriptableContext } from 'chart.js';
	import { CategoryScale, Chart, Filler, LinearScale, LineElement, PointElement } from 'chart.js';
	import { Line } from 'svelte-chartjs';

	import { format } from 'date-fns';
	import { ru } from 'date-fns/locale';
	import {
		CHART_PERIOD_FILTERS,
		filterChartPointsByPeriod,
		type ChartPeriod,
		type ChartType
	} from '../model/model.svelte';

	Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

	let {
		charts,
		periods,
		onChangePeriod
	}: { charts: ChartType[]; periods: ChartPeriod; onChangePeriod: (period: ChartPeriod) => void } =
		$props();

	const filteredPoints = $derived(filterChartPointsByPeriod(charts, periods));

	const chartData = $derived({
		labels: filteredPoints.map((d) => format(new Date(d.date), 'MMM', { locale: ru })),
		datasets: [
			{
				data: filteredPoints.map((d) => d.value),
				borderColor: '#3B82F6',
				borderWidth: 3,
				tension: 0.45,
				fill: true,
				pointRadius: (ctx: ScriptableContext<'line'>) =>
					ctx.dataIndex === ctx.dataset.data.length - 1 ? 5 : 0,
				pointBackgroundColor: '#3B82F6',
				pointBorderWidth: 0,
				backgroundColor: (ctx: ScriptableContext<'line'>) => {
					const { chart } = ctx;
					const { ctx: c, chartArea } = chart;
					if (!chartArea) return;

					const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
					gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
					gradient.addColorStop(1, 'rgba(59,130,246,0)');
					return gradient;
				}
			}
		]
	});

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: { enabled: false }
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: {
					color: '#94A3B8',
					font: { size: 14 }
				}
			},
			y: {
				display: false
			}
		}
	};
</script>

<div class="p-4 rounded-[12px] border border-solid border-[#F1F5F9] shadow-sm w-full mb-5">
	<div class="h-[200px]">
		<Line data={chartData} {options} />
	</div>

	<div class="flex justify-between mt-4 text-sm">
		{#each CHART_PERIOD_FILTERS as f}
			<button
				type="button"
				class="px-3 py-1 rounded-lg transition"
				class:bg-black={periods === f}
				class:text-white={periods === f}
				class:text-gray-400={periods !== f}
				onclick={() => onChangePeriod(f)}
			>
				{f}
			</button>
		{/each}
	</div>
</div>

<!-- <div class="p-4 rounded-[12px] border border-solid border-[#F1F5F9] bg-white mb-5 h-[260px]">
	
</div> -->
