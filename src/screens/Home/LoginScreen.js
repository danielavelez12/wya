// LoginScreen.js
import { View, TextInput, Button, Alert } from 'react-native';
import { useState } from "react";

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  return (
    <View>
        <>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Verification Code"
          />
          <Button title="Verify Code" onPress={() => console.log("hello")} />
        </>
    </View>
  );
};

export default LoginScreen;
