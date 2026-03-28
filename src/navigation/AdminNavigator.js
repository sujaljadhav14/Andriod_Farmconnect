import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import AdminPaymentsAgreementsScreen from '../screens/admin/AdminPaymentsAgreementsScreen';

const Stack = createNativeStackNavigator();

const AdminNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#512DA8' },
                headerTintColor: Colors.white,
                headerTitleStyle: { fontWeight: '600' },
            }}
        >
            <Stack.Screen
                name="AdminPaymentsAgreements"
                component={AdminPaymentsAgreementsScreen}
                options={{ title: 'Admin Monitor' }}
            />
        </Stack.Navigator>
    );
};

export default AdminNavigator;
