import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to local server...');
  try {
    await page.goto('http://localhost:5173');
    
    await page.evaluate(() => {
      const scene = {
        "version": 1,
        "objects": {
          "point-1": { "id": "point-1", "type": "point", "x": -4, "y": 2, "locked": false, "visible": true, "dependencies": [], "dependents": ["poly-1"], "style": { "fill": "transparent", "stroke": "#000", "strokeWidth": 2, "strokeOpacity": 1, "fillOpacity": 1 } },
          "point-2": { "id": "point-2", "type": "point", "x": -2, "y": 0, "locked": false, "visible": true, "dependencies": [], "dependents": ["poly-1"], "style": { "fill": "transparent", "stroke": "#000", "strokeWidth": 2, "strokeOpacity": 1, "fillOpacity": 1 } },
          "point-3": { "id": "point-3", "type": "point", "x": -4, "y": -2, "locked": false, "visible": true, "dependencies": [], "dependents": ["poly-1"], "style": { "fill": "transparent", "stroke": "#000", "strokeWidth": 2, "strokeOpacity": 1, "fillOpacity": 1 } },
          "poly-1": { "id": "poly-1", "type": "polynomial", "pointIds": ["point-1", "point-2", "point-3"], "locked": false, "visible": true, "dependencies": ["point-1", "point-2", "point-3"], "dependents": [], "style": { "fill": "transparent", "stroke": "#000", "strokeWidth": 2, "strokeOpacity": 1, "fillOpacity": 1 } }
        },
        "view": { "x": 0, "y": 0, "zoom": 1 }
      };
      localStorage.setItem("geometry_scene", JSON.stringify(scene)); // Try both keys
      localStorage.setItem("scene", JSON.stringify(scene));
    });

    console.log('Reloading with injected scene...');
    await page.reload();
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.log('GOTO FAILED:', e);
  }
  await browser.close();
})();
