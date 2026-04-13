import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { fetchBuilds } from '../api';

export default function Home(){
  const [builds, setBuilds] = useState([]);
  const [q, setQ] = useState('');

  useEffect(()=>{
    fetchBuilds()
      .then(data => {
        // ✅ Adicione um console.log para ver o que a API está retornando
        console.log("Dados recebidos da API (useEffect):", data);
        // ✅ Garanta que 'builds' seja sempre um array
        setBuilds(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.error("Erro ao buscar builds no carregamento:", error);
        setBuilds([]); // Em caso de erro, define como array vazio
      });
  }, []);

  async function onSearch(){
    try {
      const res = await fetchBuilds(q);
      // ✅ Adicione um console.log para ver o que a API está retornando
      console.log("Dados recebidos da API (onSearch):", res);
      // ✅ Garanta que 'builds' seja sempre um array
      setBuilds(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Erro ao buscar builds na pesquisa:", error);
      setBuilds([]); // Em caso de erro, define como array vazio
    }
  }

  return (
    <View>
      <Text style={{fontSize:18,fontWeight:'bold'}}>Builds</Text>
      <TextInput value={q} onChangeText={setQ} placeholder="search" style={{borderWidth:1,padding:6,marginVertical:6}} />
      <Button title="Search" onPress={onSearch} />
      <ScrollView style={{maxHeight:200,marginTop:10}}>
        {Array.isArray(builds) && builds.length > 0 ? (
          builds.map(b=> (
            <View key={b.id} style={{padding:6,borderBottomWidth:1}}>
              <Text style={{fontWeight:'bold'}}>{b.name}</Text>
              <Text>{b.description}</Text>
            </View>
          ))
        ) : (
          <Text style={{padding:6, textAlign:'center'}}>Nenhuma build encontrada ou formato de dados incorreto.</Text>
        )}
      </ScrollView>
    </View>
  );
}