
/**
 * Gerador de Payload PIX Estático (EMV QRCPS)
 * Otimizado para chaves de Telefone Celular
 */

function crc16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePixPayload(amount: number): string {
  // CONFIGURAÇÃO DA CHAVE
  // Nota: Chave de telefone DEVE começar com +55 para ser válida no payload
  const pixKey = "+5562982166200"; 
  const merchantName = "SAMUEL R PASSOS";
  const merchantCity = "GOIANIA";
  const txid = "ESTUDO"; // TXID simples sem caracteres especiais
  const amountStr = amount.toFixed(2);

  // Tag 00: Payload Format Indicator
  const tag00 = formatTag("00", "01");

  // Tag 26: Merchant Account Information
  const sub26_00 = formatTag("00", "br.gov.bcb.pix");
  const sub26_01 = formatTag("01", pixKey);
  const tag26 = formatTag("26", sub26_00 + sub26_01);

  // Tags Adicionais
  const tag52 = formatTag("52", "0000"); 
  const tag53 = formatTag("53", "986");  
  const tag54 = formatTag("54", amountStr); 
  const tag58 = formatTag("58", "BR");   
  const tag59 = formatTag("59", merchantName); 
  const tag60 = formatTag("60", merchantCity); 

  // Tag 62: Campo de Dados Adicionais
  const sub62_05 = formatTag("05", txid);
  const tag62 = formatTag("62", sub62_05);

  // Tag 63: CRC16
  const tag63 = "6304";

  const payloadBase = tag00 + tag26 + tag52 + tag53 + tag54 + tag58 + tag59 + tag60 + tag62 + tag63;
  
  return payloadBase + crc16(payloadBase);
}
