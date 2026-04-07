import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme/tokens";

import HomeScreen from "../screens/HomeScreen";
import PatientHealthRecordsScreen from "../screens/PatientHealthRecordsScreen";
import PatientAppointmentsScreen from "../screens/PatientAppointmentsScreen";
import FacilityFinderScreen from "../screens/FacilityFinderScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === "Home") {
                        iconName = "home";
                    } else if (route.name === "Records") {
                        iconName = "folder";
                    } else if (route.name === "Appointments") {
                        iconName = "calendar";
                    } else if (route.name === "Care") {
                        iconName = "map-pin";
                    } else if (route.name === "Profile") {
                        iconName = "user";
                    }

                    return (
                        <Feather
                            name={iconName}
                            size={20}
                            color={color}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    );
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    height: 75,
                    paddingBottom: spacing.xs,
                    paddingTop: spacing.xs,
                    backgroundColor: colors.surface,
                },
                tabBarLabelStyle: {
                    ...typography.caption,
                    fontWeight: "600",
                    marginBottom: 8,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: "Home" }}
            />
            <Tab.Screen
                name="Records"
                component={PatientHealthRecordsScreen}
                options={{ title: "Records" }}
            />
            <Tab.Screen
                name="Appointments"
                component={PatientAppointmentsScreen}
                options={{ title: "Appointments" }}
            />
            <Tab.Screen
                name="Care"
                component={FacilityFinderScreen}
                options={{ title: "Care" }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: "Profile" }}
            />
        </Tab.Navigator>
    );
};

export default MainTabs;
