import React, { useState, useRef } from 'react';
import { Image, StyleSheet, View, Button, Text, TextInput } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import * as ImagePicker from 'expo-image-picker';
import MLKitOcr from 'react-native-mlkit-ocr';
import SelectDropdown from 'react-native-select-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';

export default function HomeScreen() {
  const [extractedData, setExtractedData] = useState<string[]>([]);
  const [extractedValue, setExtractedValue] = useState<string[]>([]);
  const [textTransform, setTextTransform] = useState<string>();
  const dropdownRef1 = useRef<SelectDropdown>(null); // Referência ao SelectDropdown
  const dropdownRef2 = useRef<SelectDropdown>(null); // Referência ao SelectDropdown
  const dropdownRef3 = useRef<SelectDropdown>(null); // Referência ao SelectDropdown  
  const dropdownRef4 = useRef<SelectDropdown>(null); // Referência ao SelectDropdown  
  const textinput1 = useRef<TextInput>(null);
  const textinput2 = useRef<TextInput>(null);
  const textinput3 = useRef<TextInput>(null);  
  const [date, setDate] = useState('');
  const tipoFatura = [
    'Água',
    'Luz'
  ];

  const [selectedTipoFatura, setSelectedTipoFatura] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [selectedValorTotal, setSelectedValorTotal] = useState<string | null>(null);
  const [selectedEncargos, setSelectedEncargos] = useState<string | null>(null);

  const [inputData, setInputData] = useState<string>('');
  const [inputValorTotal, setInputValorTotal] = useState<string>('');
  const [inputEncargos, setInputEncargos] = useState<string>('');

  const handleDateChange = (text: string) => {
    let formattedText = text.replace(/\D/g, ''); // Remove qualquer caractere que não seja um dígito

    if (formattedText.length > 2) {
      formattedText = formattedText.slice(0, 2) + '/' + formattedText.slice(2);
    }
    if (formattedText.length > 5) {
      formattedText = formattedText.slice(0, 5) + '/' + formattedText.slice(5);
    }
    if (formattedText.length > 10) {
      formattedText = formattedText.slice(0, 10); // Limita a 10 caracteres (DD/MM/YYYY)
    }

    setDate(formattedText);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });

    if (!result.canceled) {
      // Reseta o SelectDropdown para o valor padrão
      dropdownRef1.current?.reset();
      dropdownRef2.current?.reset();
      dropdownRef3.current?.reset();
      dropdownRef4.current?.reset();
      textinput1.current?.clear();
      textinput2.current?.clear();
      textinput3.current?.clear();
      setTextTransform("");
      performOCR(result.assets[0].uri);
    }
  };

  const performOCR = async (uri: string) => {
    try {
      const recognizedTextArray = await MLKitOcr.detectFromFile(uri);

      const recognizedText = recognizedTextArray.map(block => block.text.trim()).join(' ').replace(/\s+/g, ' ');

      const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;
      const valuePattern = /R?\$?\s?\d{1,3}(?:\.\d{3})*,\d{2}/g;

      const dates = (recognizedText.match(datePattern) || []).map(date => date.trim());
      const values = (recognizedText.match(valuePattern) || []).map(value => value.trim().replace(' ','').replace('R','').replace('$',''));

      const filteredData = [...dates].filter(item => item && item.length > 0);
      const filteredValue = [...values].filter(item => item && item.length > 0);

      if (filteredData.length > 0) {
        setExtractedData(filteredData);
      } else {
        setExtractedData(["Nenhum dado relevante encontrado."]);
      }

      if (filteredValue.length > 0) {
        setExtractedValue(filteredValue);
      } else {
        setExtractedValue(["Nenhum dado relevante encontrado."]);
      }

    } catch (err) {
      console.error(err);
      setExtractedData(["Erro ao realizar OCR."]);
    }
  };

  const Transform = async () => {
    try {
      let cump = "";
      let hora = new Date().getHours()
      if(hora < 13){
        cump = "Bom dia"
      }else if(hora < 18){
        cump = "Boa tarde"
      }else{ 
        cump = "Boa noite"
      }
      
      let data = (inputData != "")? inputData : selectedData
      let vl_total = Number((inputValorTotal != "")? inputValorTotal.toString().replace(",", "."): selectedValorTotal?.toString().replace(",", "."))
      let vl_encargo = Number((inputEncargos != "") ? inputEncargos.toString().replace(",", ".") : selectedEncargos?.toString().replace(",", "."))
      let vl_total_sem_juros = vl_total - vl_encargo


      let modelo = `*COMUNICADO*
${cump} a todos, estou enviando a conta de ${selectedTipoFatura} do condomínio com o vencimento para o dia
${data}.
Valor Total: *R$${vl_total}*
Valor Total s / Juros: *R$${vl_total_sem_juros}*
Valor por Apartamento: *R$${vl_total_sem_juros / 5}*
Valor Juros/ Multa: *R$${vl_encargo}*`;
      

      // Realize as operações desejadas com esses valores
      setTextTransform(modelo);
      Clipboard.setStringAsync(modelo);

    } catch (err) {
      console.error(err);
      setTextTransform("Erro ao transformar em texto valores inputados.");
    }
  }

  return (
    <View style={styles.container}>
      <View>
        <Button title="Selecionar Imagem" onPress={pickImage} />
      </View>

      <View style={styles.titleCamp}>
        <Text style={styles.titleText}>
          {"Tipo Fatura:"}
        </Text>
      </View>

      <View style={styles.row}>
        <SelectDropdown
          ref={dropdownRef1} // Passa a referência para o SelectDropdown
          data={tipoFatura}
          onSelect={(selectedItem, index) => {
            setSelectedTipoFatura(selectedItem);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && selectedItem) || 'Selecione'}
                </Text>
              </View>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={true}
          dropdownStyle={styles.dropMenuFatura}
        />
      </View>

      <View style={styles.titleCamp}>
        <Text style={styles.titleText}>
          {"Data:"}
        </Text>
      </View>

      <View style={styles.row}>
        <SelectDropdown
          ref={dropdownRef2} // Passa a referência para o SelectDropdown
          data={extractedData}
          onSelect={(selectedItem, index) => {
            setSelectedData(selectedItem);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && selectedItem) || 'Selecione'}
                </Text>
              </View>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={true}
          dropdownStyle={styles.dropdownMenuStyle}
        />
        <TextInput
          ref={textinput1}
          style={styles.input}
          placeholder='Data'
          value={date}
          onChangeText={(text) => {
            handleDateChange(text);
            setInputData(text); // Atualiza o estado do TextInput de data
          }}
          keyboardType='numeric' // Define o teclado numérico
          maxLength={10} // Limita o campo a 10 caracteres
        />
      </View>

      <View style={styles.titleCamp}>
        <Text style={styles.titleText}>
          {"Valor Total:"}
        </Text>
      </View>

      <View style={styles.row}>
        <SelectDropdown
          ref={dropdownRef3} // Passa a referência para o SelectDropdown
          data={extractedValue}
          onSelect={(selectedItem, index) => {
            setSelectedValorTotal(selectedItem);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && selectedItem) || 'Selecione'}
                </Text>
              </View>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={true}
          dropdownStyle={styles.dropdownMenuStyle}
        />
        <TextInput
          ref={textinput2}
          style={styles.input}
          placeholder='Valor Total'
          value={inputValorTotal}
          onChangeText={setInputValorTotal}
          keyboardType='numeric' // Define o teclado numérico
          maxLength={10} // Limita o campo a 10 caracteres
        />
      </View>

      <View style={styles.titleCamp}>
        <Text style={styles.titleText}>
          {"Encargos:"}
        </Text>
      </View>

      <View style={styles.row}>
        <SelectDropdown
          ref={dropdownRef4} // Passa a referência para o SelectDropdown
          data={extractedValue}
          onSelect={(selectedItem, index) => {
            setSelectedEncargos(selectedItem);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && selectedItem) || 'Selecione'}
                </Text>
              </View>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={true}
          dropdownStyle={styles.dropdownMenuStyle}
        />
        <TextInput
          ref={textinput2}
          style={styles.input}
          placeholder='Encargos'
          value={inputEncargos}
          onChangeText={setInputEncargos}
          keyboardType='numeric' // Define o teclado numérico
          maxLength={10} // Limita o campo a 10 caracteres
        />
      </View>

      <View style={styles.ButtonTransfer}>
        <Button title="Transformar" onPress={Transform} />
      </View>

      <View style={styles.titleCamp}>
        <Text style={styles.titleText}>
          {textTransform}
        </Text>
      </View>
    </View>

  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  col: {
    flexDirection: "column"
  },
  container: {
    margin: 25,
    marginTop: 80,
    //justifyContent: 'center',
    //alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontFamily: 'Cochin',
    color: "#FFFF",
  },
  titleCamp: {
    marginTop: 25,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  ButtonTransfer: {
    marginTop: 20,
  },
  input: {
    height: 40,
    margin: 12,
    borderRadius: 12,
    padding: 10,
    width: 150,
    backgroundColor: '#E9ECEF',
  },
  dropdownButtonStyle: {
    width: 200,
    height: 40,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  dropMenuFatura: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    marginTop: -40,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    marginTop: -40,
    height: '20%',
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
});
