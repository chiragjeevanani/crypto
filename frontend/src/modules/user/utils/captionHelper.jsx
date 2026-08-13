import React from 'react';

/**
 * Parses a caption string and returns a React element array with styled, clickable hashtags and mentions.
 * @param {string} caption 
 * @param {function} navigate 
 */
export function renderCaptionWithLinks(caption, navigate) {
  if (!caption || typeof caption !== 'string') return '';
  
  // Split caption by words/spaces to keep formatting, or use regex split
  const parts = caption.split(/(\s+)/);
  
  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      // Clean handle (remove trailing punctuation if any)
      const handleClean = part.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
      const punctuation = part.slice(1 + handleClean.length);
      
      const handleClick = async (e) => {
        e.stopPropagation();
        try {
          const searchServiceModule = await import('../services/searchService');
          const searchService = searchServiceModule.searchService;
          const res = await searchService.search(handleClean);
          if (res && res.users && res.users.length > 0) {
            const matched = res.users.find(u => (u.handle || u.username || '').toLowerCase() === handleClean.toLowerCase());
            if (matched) {
              navigate(`/user/${matched.id || matched._id}`);
              return;
            }
          }
          // Fallback to general search page if user not found
          navigate(`/home?search=${handleClean}`);
        } catch (err) {
          console.error("Failed to navigate to user handle:", err);
        }
      };

      return (
        <span key={index}>
          <span 
            onClick={handleClick} 
            className="font-bold hover:underline cursor-pointer"
            style={{ color: '#3897f0', fontWeight: 'bold' }}
          >
            @{handleClean}
          </span>
          {punctuation}
        </span>
      );
    }
    
    if (part.startsWith('#') && part.length > 1) {
      const hashtagClean = part.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
      const punctuation = part.slice(1 + hashtagClean.length);
      
      const handleClick = (e) => {
        e.stopPropagation();
        // Redirect to search or home page with search query set to hashtag
        navigate(`/home?search=%23${hashtagClean}`);
      };

      return (
        <span key={index}>
          <span 
            onClick={handleClick} 
            className="font-bold hover:underline cursor-pointer"
            style={{ color: '#3897f0', fontWeight: 'bold' }}
          >
            #{hashtagClean}
          </span>
          {punctuation}
        </span>
      );
    }
    
    return part;
  });
}
