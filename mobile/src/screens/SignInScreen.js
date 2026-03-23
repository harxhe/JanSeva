import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import Card from "../components/Card";

const SignInScreen = ({ onSuccess }) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleVerify = () => {
    onSuccess({ name: "Citizen", phone });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Samadhan</Text>
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>
        Login with your phone number to raise and track issues.
      </Text>
      <Card style={styles.card}>
        <InputField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
        />
        {otpSent ? (
          <InputField
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 6-digit OTP"
          />
        ) : null}
        <PrimaryButton
          label={otpSent ? "Verify OTP" : "Send OTP"}
          onPress={otpSent ? handleVerify : handleSendOtp}
        />
        <PrimaryButton
          label="Continue as guest"
          variant="secondary"
          onPress={() => onSuccess({ name: "Guest Citizen", phone: "" })}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  brand: {
    textTransform: "uppercase",
    letterSpacing: 4,
    color: theme.colors.inkMuted,
    fontSize: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.ink,
    marginTop: 10,
  },
  subheading: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    gap: 14,
  },
});

export default SignInScreen;
