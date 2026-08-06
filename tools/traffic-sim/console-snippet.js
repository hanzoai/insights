// Insights Loading Inspector — paste into browser DevTools console.
// Extracts script tags, init config, runtime state, and load method.
(() => {
  const scripts = [...document.querySelectorAll("script")];

  const insightsScripts = scripts.filter((s) => {
    const src = (s.src || "").toLowerCase();
    const id = (s.id || "").toLowerCase();
    const text = (s.textContent || "").toLowerCase();
    return (
      src.includes("insights") ||
      src.includes("array.js") ||
      id.includes("insights") ||
      text.includes("insights") ||
      text.includes("phc_") ||
      text.includes("ph_init")
    );
  });

  const hasInsightsInitId = !!document.getElementById("insights-init");

  const hasNextJsHydration = scripts.some((s) => {
    const text = s.textContent || "";
    return text.includes("self.__next_s") && text.includes("insights");
  });

  let initConfig = null;
  for (const s of insightsScripts) {
    const text = s.textContent || "";
    const initMatch = text.match(
      /insights\.init\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\{[\s\S]*?\})\s*\)/
    );
    if (initMatch) {
      try {
        const configStr = initMatch[2]
          .replace(/(\w+)\s*:/g, '"$1":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, "}");
        const parsed = JSON.parse(configStr);
        initConfig = {
          api_key: initMatch[1],
          api_host: parsed.api_host || null,
          ui_host: parsed.ui_host || null,
          person_profiles: parsed.person_profiles || null,
          session_recording: parsed.session_recording || null,
        };
      } catch {
        initConfig = { api_key: initMatch[1], raw: initMatch[2] };
      }
      break;
    }
  }

  if (!initConfig && window.insights && window.insights.config) {
    const c = window.insights.config;
    initConfig = {
      api_key: c.token || null,
      api_host: c.api_host || null,
      ui_host: c.ui_host || null,
      person_profiles: c.person_profiles || null,
      session_recording: c.session_recording || null,
    };
  }

  const arrayjsScript = insightsScripts.find(
    (s) => s.src && s.src.includes("array")
  );

  const runtimeDefined = typeof window.insights !== "undefined";
  let runtimeState = { defined: runtimeDefined, loaded: false };
  if (runtimeDefined && window.insights) {
    runtimeState = {
      defined: true,
      loaded: !!window.insights.__loaded,
      distinct_id: window.insights.get_distinct_id
        ? window.insights.get_distinct_id()
        : null,
      config_api_host: window.insights.config
        ? window.insights.config.api_host
        : null,
    };
  }

  let loadMethod = "none";
  if (runtimeState.loaded && hasInsightsInitId) {
    loadMethod = "snippet";
  } else if (runtimeState.loaded) {
    loadMethod = "npm";
  }

  const result = {
    url: window.location.href,
    script_tag_count: insightsScripts.length,
    has_insights_init_id: hasInsightsInitId,
    has_nextjs_hydration: hasNextJsHydration,
    init_config: initConfig,
    runtime_state: runtimeState,
    load_method: loadMethod,
    arrayjs_src: arrayjsScript ? arrayjsScript.src : null,
    script_details: insightsScripts.map((s) => ({
      id: s.id || null,
      src: s.src || null,
      type: s.type || null,
      text_preview: (s.textContent || "").slice(0, 200),
    })),
  };

  console.info(JSON.stringify(result, null, 2));
  return result;
})();
