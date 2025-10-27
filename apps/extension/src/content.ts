(async function autofill() {
  try {
    const title = document.querySelector('input[name="title"], input#title') as HTMLInputElement | null;
    const description = document.querySelector('textarea[name="description"], textarea#description') as HTMLTextAreaElement | null;
    if (!title && !description) {
      return;
    }

    const payload = await fetch('http://localhost:8787/ext/demoPayload')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .catch((error) => {
        console.warn('SnapSell autofill payload fetch failed', error);
        return null;
      });

    if (!payload) {
      return;
    }

    if (title && typeof payload.title === 'string') {
      title.value = payload.title;
    }
    if (description && typeof payload.description === 'string') {
      description.value = payload.description;
    }
    console.log('SnapSell Autofill populated demo payload');
  } catch (error) {
    console.error('SnapSell Autofill error', error);
  }
})();
