(function () {
  const fileListEl = document.getElementById('fileList');
  const btnLoad = document.getElementById('btnLoad');
  const btnSave = document.getElementById('btnSave');
  const btnReload = document.getElementById('btnReload');
  const statusEl = document.getElementById('status');
  const editorTarget = document.getElementById('editorTarget');

  let currentPathEncoded = null;

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status status--' + (type || 'info');
  }

  function loadFileList() {
    fetch('/api/files?recursive=true')
      .then(function (r) {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(function (data) {
        const files = data.files || [];
        fileListEl.innerHTML = '<option value="">-- Select a file --</option>';
        files.forEach(function (f) {
          const opt = document.createElement('option');
          opt.value = encodeURIComponent(f);
          opt.textContent = f;
          fileListEl.appendChild(opt);
        });
      })
      .catch(function (err) {
        setStatus('Error listing files: ' + err.message, 'error');
      });
  }

  function getCsvLink() {
    return document.getElementById('csvLink');
  }

  function loadEditor() {
    if (!currentPathEncoded) return;
    editorTarget.innerHTML = '';
    var a = document.createElement('a');
    a.id = 'csvLink';
    a.href = '/api/file/raw?path=' + currentPathEncoded;
    a.setAttribute('data-oi-csv', '');
    a.setAttribute('data-oi-csv-target', 'editorTarget');
    a.setAttribute('data-oi-csv-load', '');
    a.textContent = 'Loading CSV…';
    editorTarget.appendChild(a);
    if (window.OI && window.OI.CSVs) {
      window.OI.CSVs.list = [];
      if (typeof window.OI.CSVs.get === 'function') {
        window.OI.CSVs.get();
      } else {
        a.click();
      }
    } else {
      a.click();
    }
  }

  function getEditorInstance() {
    var list = window.OI && window.OI.CSVs && window.OI.CSVs.list;
    if (list && list.length > 0 && list[0].editor && typeof list[0].editor.buildCSV === 'function') {
      return list[0].editor;
    }
    return null;
  }

  function wireSave() {
    var editor = getEditorInstance();
    if (!editor) return;
    btnSave.disabled = false;
    btnSave.onclick = function () {
      if (!currentPathEncoded) return;
      var ed = getEditorInstance();
      if (!ed) {
        setStatus('Editor not ready.', 'error');
        return;
      }
      setStatus('Saving…', 'info');
      var csv = ed.buildCSV();
      fetch('/api/file?path=' + currentPathEncoded, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csv,
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (b) { throw new Error(b.error || r.statusText); });
          setStatus('Saved. Original file overwritten.', 'success');
        })
        .catch(function (err) {
          setStatus('Error saving: ' + err.message, 'error');
        });
    };
  }

  fileListEl.addEventListener('change', function () {
    var val = fileListEl.value;
    currentPathEncoded = val || null;
    btnLoad.disabled = !val;
    btnSave.disabled = true;
    btnReload.disabled = !val;
    editorTarget.innerHTML = '';
    setStatus(val ? 'Select a file and click Load.' : '');
  });

  btnLoad.addEventListener('click', function () {
    if (!currentPathEncoded) return;
    setStatus('Loading…', 'info');
    editorTarget.innerHTML = '';
    var a = document.createElement('a');
    a.id = 'csvLink';
    a.href = '/api/file/raw?path=' + currentPathEncoded;
    a.setAttribute('data-oi-csv', '');
    a.setAttribute('data-oi-csv-target', 'editorTarget');
    a.setAttribute('data-oi-csv-load', '');
    a.textContent = 'Load CSV';
    editorTarget.appendChild(a);
    if (window.OI && window.OI.CSVs) {
      window.OI.CSVs.list = [];
      if (typeof window.OI.CSVs.get === 'function') {
        window.OI.CSVs.get();
      } else {
        a.click();
      }
    } else {
      a.click();
    }
    // Editor loads CSV asynchronously; poll until it's ready then wire Save
    var attempts = 0;
    var interval = setInterval(function () {
      attempts++;
      if (getEditorInstance() || attempts > 25) {
        clearInterval(interval);
        wireSave();
      }
    }, 200);
    setStatus('Loaded.', 'success');
  });

  btnReload.addEventListener('click', function () {
    if (!currentPathEncoded) return;
    loadEditor();
    var attempts = 0;
    var interval = setInterval(function () {
      attempts++;
      if (getEditorInstance() || attempts > 25) {
        clearInterval(interval);
        wireSave();
      }
    }, 200);
  });

  loadFileList();
})();
