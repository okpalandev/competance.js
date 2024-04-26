async function loadBustedModule(moduleName, version) {
    const cacheBuster = Date.now();
    const scriptUrl = new URL(`${moduleName}.v${version}.js?cache=${cacheBuster}`, window.location.href);
    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.defer = true;
    script.type="module";
    script.src = scriptUrl.href;
    document.body.appendChild(script);
};

loadBustedModule('competance','14');
