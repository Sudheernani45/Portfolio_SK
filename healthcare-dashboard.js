(() => {
  'use strict';

  const years = [
    { year: '2021', records: 188, charges: 13102915, los: 12.21, readmit: 45.74, mortality: 48.40, icu: 51.06, complications: 52.66 },
    { year: '2022', records: 190, charges: 14564604, los: 11.56, readmit: 48.42, mortality: 54.74, icu: 45.79, complications: 49.47 },
    { year: '2023', records: 193, charges: 13862822, los: 11.97, readmit: 52.33, mortality: 49.22, icu: 48.70, complications: 52.85 },
    { year: '2024', records: 227, charges: 17295598, los: 11.81, readmit: 51.98, mortality: 52.42, icu: 49.34, complications: 51.10 }
  ];
  const all = { year: 'all', records: 798, charges: 58825939, los: 11.88, readmit: 49.75, mortality: 51.25, icu: 48.75, complications: 51.50 };
  const severity = [
    { name: 'Mild', records: 194, los: 11.4 },
    { name: 'Moderate', records: 200, los: 12.8 },
    { name: 'Severe', records: 202, los: 11.1 },
    { name: 'Critical', records: 202, los: 12.3 }
  ];
  const diagnoses = [
    { name: 'Asthma', records: 125 },
    { name: 'Cancer', records: 120 },
    { name: 'Fracture', records: 115 },
    { name: 'COVID-19', records: 115 },
    { name: 'Hypertension', records: 114 },
    { name: 'Diabetes', records: 110 },
    { name: 'Heart Disease', records: 99 }
  ];

  const byId = (id) => document.getElementById(id);
  const yearFilter = byId('year-filter');
  const chart = byId('year-chart');
  let chartMetric = 'records';

  const percent = (value) => `${value.toFixed(2)}%`;
  const compactCurrency = (value) => `$${(value / 1000).toFixed(1)}k`;
  function renderMetrics(period) {
    byId('metric-records').textContent = period.records.toLocaleString('en-US');
    byId('metric-period').textContent = period.year === 'all' ? 'Four-year dataset' : `Admission year ${period.year}`;
    byId('metric-los').innerHTML = `${period.los.toFixed(2)} <small>days</small>`;
    byId('metric-readmit').innerHTML = `${period.readmit.toFixed(2)}<small>%</small>`;
    byId('metric-cost').textContent = compactCurrency(period.charges / period.records);
    byId('metric-mortality').textContent = percent(period.mortality);
    byId('mortality-ring').parentElement.style.setProperty('--mortality-angle', `${period.mortality * 3.6}deg`);
    byId('metric-icu').textContent = percent(period.icu);
    byId('metric-complications').textContent = percent(period.complications);
  }

  function renderYearChart(selectedYear) {
    const key = chartMetric;
    const values = years.map((item) => item[key]);
    const maximum = Math.max(...values) * 1.15;
    const label = key === 'records' ? 'Encounter records' : 'Total charges';
    byId('trend-legend').textContent = label;
    chart.setAttribute('aria-label', `${label} by year`);
    chart.replaceChildren(...years.map((item) => {
      const column = document.createElement('div');
      column.className = 'year-column';
      const value = document.createElement('span');
      value.className = 'year-value';
      value.textContent = key === 'records' ? item.records : compactCurrency(item.charges);
      const wrap = document.createElement('div');
      wrap.className = 'year-bar-wrap';
      const bar = document.createElement('div');
      bar.className = `year-bar${selectedYear === item.year ? ' is-selected' : ''}`;
      bar.style.height = `${Math.max(5, item[key] / maximum * 100)}%`;
      bar.setAttribute('aria-hidden', 'true');
      wrap.append(bar);
      const year = document.createElement('span');
      year.className = 'year-label';
      year.textContent = item.year;
      column.append(value, wrap, year);
      return column;
    }));
    if (key === 'charges') {
      byId('trend-legend').textContent = 'Total charges';
    }
  }

  function renderSeverity() {
    const host = byId('severity-chart');
    const maximum = Math.max(...severity.map((item) => item.los)) * 1.12;
    host.replaceChildren(...severity.map((item) => {
      const row = document.createElement('div');
      row.className = 'hbar-row';
      const name = document.createElement('span');
      name.className = 'hbar-name';
      name.textContent = item.name;
      const track = document.createElement('div');
      track.className = 'hbar-track';
      const fill = document.createElement('div');
      fill.className = 'hbar-fill';
      fill.style.width = `${item.los / maximum * 100}%`;
      track.append(fill);
      const value = document.createElement('span');
      value.className = 'hbar-value';
      value.textContent = `${item.los.toFixed(1)} d`;
      row.append(name, track, value);
      return row;
    }));
  }

  function renderDiagnoses() {
    const host = byId('diagnosis-chart');
    const maximum = Math.max(...diagnoses.map((item) => item.records));
    host.replaceChildren(...diagnoses.map((item) => {
      const row = document.createElement('div');
      row.className = 'diagnosis-row';
      const name = document.createElement('span');
      name.className = 'diagnosis-name';
      name.textContent = item.name;
      const track = document.createElement('div');
      track.className = 'diagnosis-track';
      const fill = document.createElement('div');
      fill.className = 'diagnosis-fill';
      fill.style.width = `${item.records / maximum * 100}%`;
      track.append(fill);
      const value = document.createElement('span');
      value.className = 'diagnosis-value';
      value.textContent = item.records;
      row.append(name, track, value);
      return row;
    }));
  }

  function update() {
    const selectedYear = yearFilter.value;
    const period = selectedYear === 'all' ? all : years.find((item) => item.year === selectedYear);
    if (!period) {
      throw new Error(`No healthcare summary found for year ${selectedYear}.`);
    }
    renderMetrics(period);
    renderYearChart(selectedYear);
  }

  yearFilter.addEventListener('change', update);
  document.querySelectorAll('.segment').forEach((button) => {
    button.addEventListener('click', () => {
      chartMetric = button.dataset.metric;
      document.querySelectorAll('.segment').forEach((segment) => {
        const active = segment === button;
        segment.classList.toggle('active', active);
        segment.setAttribute('aria-pressed', String(active));
      });
      renderYearChart(yearFilter.value);
    });
  });

  renderSeverity();
  renderDiagnoses();
  update();
})();
