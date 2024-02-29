document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const fileInput = document.getElementById('fileInput');
  const minSearchesInput = document.getElementById('minSearches');
  const maxBidInput = document.getElementById('maxBid');
  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.getElementById('loading');

  analyzeBtn.addEventListener('click', function() {
      const file = fileInput.files[0];
      const minSearches = parseInt(minSearchesInput.value, 10);
      const maxBid = parseFloat(maxBidInput.value.replace(',', '.')); // Ensure maxBid uses '.' for decimals

      if (!file) {
          alert('Please select a file to analyze.');
          return;
      }

      if (isNaN(minSearches) || isNaN(maxBid)) {
          alert('Please enter valid criteria for minimum searches and maximum bid.');
          return;
      }

      loadingDiv.classList.remove('hidden');

      if (/\.csv$/.test(file.name)) {
          const reader = new FileReader();
          reader.onload = function(e) {
              processCSV(e.target.result, minSearches, maxBid);
          };
          reader.onerror = function() {
              alert('Failed to read the file');
              loadingDiv.classList.add('hidden');
          };
          reader.readAsText(file);
      } else {
          const reader = new FileReader();
          reader.onload = function(e) {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              processExcel(workbook, minSearches, maxBid);
          };
          reader.onerror = function() {
              alert('Failed to read the file');
              loadingDiv.classList.add('hidden');
          };
          reader.readAsArrayBuffer(file);
      }
  });

  function processCSV(csvText, minSearches, maxBid) {
    const rows = csvText.split('\n').slice(1); // Assuming the first row is headers
    const filteredRows = rows.filter(row => {
        const columns = row.split(',');
        const searches = parseInt(columns[1], 10);
        const bidStr = columns[2].replace(',', '.'); // Replace commas with periods
        const bid = parseFloat(bidStr);
        return searches >= minSearches && bid <= maxBid;
    });

    displayResults(filteredRows);
    loadingDiv.classList.add('hidden');
  }

  function processExcel(workbook, minSearches, maxBid) {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1); // Assuming the first row is headers
    const filteredRows = rows.filter(row => {
        const searches = parseInt(row[1], 10);
        const bidStr = String(row[2]).replace(',', '.'); // Replace commas with periods
        const bid = parseFloat(bidStr);
        return searches >= minSearches && bid <= maxBid;
    });

    displayResults(filteredRows.map(row => [row[0], row[1], row[2]])); // Map to the expected format for display
    loadingDiv.classList.add('hidden');
  }

  function displayResults(rows) {
      resultsDiv.innerHTML = '';
      if (rows.length === 0) {
          resultsDiv.textContent = 'No keywords match your criteria.';
          return;
      }

      const table = document.createElement('table');
      table.className = 'table-auto w-full border-collapse border border-gray-500';
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      ['Keyword', 'Avg. Monthly Searches', 'Top of Page Bid (High Range)'].forEach(text => {
          const th = document.createElement('th');
          th.textContent = text;
          th.className = 'border border-gray-400 px-4 py-2';
          headerRow.appendChild(th);
      });

      const tbody = table.createTBody();
      rows.forEach((row, index) => {
          const tr = tbody.insertRow();
          tr.className = index % 2 === 0 ? 'bg-gray-100' : 'bg-white';
          row.forEach((text, colIndex) => {
              if (colIndex <= 2) { // Only display the first 3 columns: Keyword, Searches, Bid
                  const td = tr.insertCell();
                  td.textContent = text;
                  td.className = 'border border-gray-400 px-4 py-2';
              }
          });
      });

      resultsDiv.appendChild(table);
  }
});
