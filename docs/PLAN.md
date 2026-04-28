# Profile Update Debugging Plan

## Objective
Identify and fix the issue preventing users from updating their name and bio on the Profile page (`/profile`).

## Phase 1: Frontend Analysis
1. **Component Verification (`ProfilePage.jsx`)**:
   - Check the edit form state mapping for `name`/`fullName`/`username` and `bio`.
   - Verify that `onEdit` and `onSavePersonalInfo` properly extract form values and call `updateProfile`.
2. **Store Verification (`useUserStore.js`)**:
   - Verify the payload constructed in `updateProfile`.
   - Check if the payload keys (`name`, `bio`) align with what the backend expects.
3. **API Service Verification (`authService.js`)**:
   - Ensure the PATCH/PUT request correctly transmits the JSON payload.

## Phase 2: Backend Analysis
1. **Controller Verification (`userController.js` or similar)**:
   - Check the `updateProfile` endpoint implementation.
   - Verify which fields are explicitly destructured or allowed to be updated. (e.g., if `name` or `bio` are missing from the allowed list).
2. **Database Model Verification (`User` model)**:
   - Ensure the Mongoose schema correctly supports `name` and `bio` fields.

## Phase 3: Resolution & Testing
1. Apply fixes in the identified layer (Frontend or Backend).
2. Verify that state synchronizes correctly so changes reflect instantly in the UI without a hard reload.
3. Perform a final test to update name and bio and confirm database persistence.
