import React from 'react';
import EditUser from './EditUser';

// lightweight wrapper to reuse EditUser in creation mode
export default function UserCreatePage() {
    return <EditUser createMode={true} />;
}
