import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminOversightScreen from '../screens/admin/AdminOversightScreen';
import AdminDisputesScreen from '../screens/admin/AdminDisputesScreen';
import AdminPaymentsAgreementsScreen from '../screens/admin/AdminPaymentsAgreementsScreen';
import AdminKYCScreen from '../screens/admin/AdminKYCScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOptions = {
    headerStyle: { backgroundColor: '#512DA8' },
    headerTintColor: Colors.white,
    headerTitleStyle: { fontWeight: '600' },
};

const AdminDashboardStack = () => (
    <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
            name="AdminDashboardMain"
            component={AdminDashboardScreen}
            options={{ title: 'Admin Dashboard' }}
        />
    </Stack.Navigator>
);

const AdminUsersStack = () => (
    <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
            name="AdminUsersMain"
            component={AdminUserManagementScreen}
            options={{ title: 'User Management' }}
        />
        <Stack.Screen
            name="AdminUserDetail"
            component={AdminUserDetailScreen}
            options={({ route }) => ({ title: route?.params?.userName || 'User Details' })}
        />
    </Stack.Navigator>
);

const AdminOversightStack = () => (
    <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
            name="AdminOversightMain"
            component={AdminOversightScreen}
            options={{ title: 'Platform Oversight' }}
        />
    </Stack.Navigator>
);

const AdminFinanceStack = () => (
    <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
            name="AdminPaymentsAgreements"
            component={AdminPaymentsAgreementsScreen}
            options={{ title: 'Finance and Legal' }}
        />
    </Stack.Navigator>
);

const AdminDisputesStack = () => (
    <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
            name="AdminDisputesMain"
            component={AdminDisputesScreen}
            options={{ title: 'Disputes' }}
        />
    </Stack.Navigator>
);

const AdminKYCStack = () => (
    <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
            name="AdminKYCMain"
            component={AdminKYCScreen}
            options={{ title: 'KYC Verification' }}
        />
    </Stack.Navigator>
);

const AdminNavigator = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#512DA8',
            tabBarInactiveTintColor: Colors.textSecondary,
            tabBarStyle: {
                paddingBottom: 4,
                height: 60,
            },
            tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '500',
            },
        }}
    >
        <Tab.Screen
            name="AdminDashboard"
            component={AdminDashboardStack}
            options={{
                tabBarLabel: 'Dashboard',
                tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />,
            }}
        />

        <Tab.Screen
            name="AdminUsers"
            component={AdminUsersStack}
            options={{
                tabBarLabel: 'Users',
                tabBarIcon: ({ color, size }) => <MaterialIcons name="groups" size={size} color={color} />,
            }}
        />

        <Tab.Screen
            name="AdminOversight"
            component={AdminOversightStack}
            options={{
                tabBarLabel: 'Oversight',
                tabBarIcon: ({ color, size }) => <MaterialIcons name="monitor" size={size} color={color} />,
            }}
        />

        <Tab.Screen
            name="AdminFinance"
            component={AdminFinanceStack}
            options={{
                tabBarLabel: 'Finance',
                tabBarIcon: ({ color, size }) => <MaterialIcons name="account-balance" size={size} color={color} />,
            }}
        />

        <Tab.Screen
            name="AdminDisputes"
            component={AdminDisputesStack}
            options={{
                tabBarLabel: 'Disputes',
                tabBarIcon: ({ color, size }) => <MaterialIcons name="report-problem" size={size} color={color} />,
            }}
        />

        <Tab.Screen
            name="AdminKYC"
            component={AdminKYCStack}
            options={{
                tabBarLabel: 'KYC',
                tabBarIcon: ({ color, size }) => <MaterialIcons name="assignment-ind" size={size} color={color} />,
            }}
        />
    </Tab.Navigator>
);

export default AdminNavigator;
