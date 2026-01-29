#!/bin/bash
cp client/src/components/modals/ReviewModal.tsx client/src/components/modals/ReviewModal.tsx.bak
sed -i 's/className="font-medium mb-2"/className="section-header"/g' client/src/components/modals/ReviewModal.tsx
echo "Headers updated"
