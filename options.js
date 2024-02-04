const saveOptions = (e) => {
  e.preventDefault();
  const scihubMirrorValue = document.querySelector("input[name='scihub-mirror']:checked").value;
  browser.storage.sync.set({ scihubMirror: scihubMirrorValue });

  const libgenMirrorValue = document.querySelector("input[name='libgen-mirror']:checked").value;
  browser.storage.sync.set({ libgenMirror: libgenMirrorValue });
}

const restoreOptions = async () => {
  try {
    const { scihubMirror } = await browser.storage.sync.get('scihubMirror');
    if (scihubMirror) {
      document.querySelector(`input[name='scihub-mirror'][value='${scihubMirror}']`).checked = true;
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }

  try {
    const { libgenMirror } = await browser.storage.sync.get('libgenMirror');
    if (libgenMirror) {
      document.querySelector(`input[name='libgen-mirror'][value='${libgenMirror}']`).checked = true;
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

document.getElementById('settingsForm').addEventListener('submit', function(event) {
  event.preventDefault();

  var notification = document.querySelector('.notification');
  notification.style.display = 'block';

  setTimeout(function() {
      notification.style.display = 'none';
  }, 2000);

});
