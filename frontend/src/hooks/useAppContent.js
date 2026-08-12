export const useAppContent = () => {
  // Returns a static default config object used by CreatePage (2).jsx
  return {
    config: {
      createFlow: {
        durations: ['15s', '30s', '60s', '3m', '10m'],
        speeds: ['0.3x', '0.5x', '1x', '2x', '3x'],
        canvasImage: '',
        galleryItems: [],
        filters: [],
        sounds: [],
        locations: {
          chips: [],
          results: []
        },
        hashtagSuggestions: [],
        linkOptions: [],
        shareTargets: [],
        sideTools: [
          { id: 'flip', label: 'Flip' },
          { id: 'speed', label: 'Speed' },
          { id: 'timer', label: 'Timer' },
          { id: 'filters', label: 'Filters' }
        ],
        previewTools: [],
        editorActions: [],
        editorPrimaryTabs: []
      }
    }
  };
};
