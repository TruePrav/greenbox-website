# Backup Components

This folder contains backup versions of components that have been replaced or are no longer actively used.

## Files

### GoogleMapsAddress.tsx.backup
- **Original purpose**: Google Maps integration with address input and interactive map
- **Replaced by**: `SimpleAddressInput.tsx`
- **Reason for backup**: Google Maps loading was inconsistent and caused "Loading Google Maps..." stuck states
- **Status**: Not imported or used anywhere in the application
- **Last used**: Before implementing SimpleAddressInput component

## Notes
- These components are kept as backups in case they need to be restored
- They are not imported anywhere in the application to prevent conflicts
- The `.backup` extension ensures they won't be accidentally imported
- If you need to restore any of these components, rename them back to their original `.tsx` extension and update the imports in the relevant pages
