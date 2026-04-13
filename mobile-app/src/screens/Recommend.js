import React, {useState} from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { recommend } from '../api';

export default function Recommend(){
  const [chars, setChars] = useState('Sereniel');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onRecommend(){
    setLoading(true);
    const res = await recommend(chars.split(',').map(s=>s.trim()));
    setResult(res.recommendation);
    setLoading(false);
  }

  return (
    <View style={{marginTop:20}}>
      <Text style={{fontSize:18,fontWeight:'bold'}}>Recommend</Text>
      <Text>Enter characters separated by comma (e.g. Sereniel, Haru)</Text>
      <TextInput value={chars} onChangeText={setChars} style={{borderWidth:1,padding:6,marginVertical:6}} />
      <Button title={loading? 'Thinking...':'Recommend'} onPress={onRecommend} disabled={loading} />
      {result && (
        <ScrollView style={{maxHeight:200,marginTop:10}}>
          <Text>{result}</Text>
        </ScrollView>
      )}
    </View>
  );
}
