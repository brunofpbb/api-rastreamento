# Mock Rastreamento API

API fictícia para continuidade do desenvolvimento do app de rastreamento enquanto a API oficial não é disponibilizada.

O retorno principal segue o contrato **Web Service – Modelo 3** fornecido: `COLUMNS` + `DATA`, com os campos:

- `DATAHORA`
- `ORDEM`
- `LINHA`
- `LATITUDE`
- `LONGITUDE`
- `VELOCIDADE`

Os trajetos são extraídos dos KMLs reais fornecidos. Os veículos são distribuídos entre as linhas disponíveis e suas posições são calculadas a partir do relógio, portanto não dependem de banco de dados e continuam coerentes após restart do serviço.

## Rodar localmente

```bash
npm install
npm start
```

Porta padrão: `3000`. No Railway, a variável `PORT` é fornecida automaticamente.

## Endpoints JSON

```text
GET /obterTodasPosicoes
GET /obterPosicoesDaLinha/:linha
GET /obterPosicoesDoOnibus/:ordem
```

Aliases:

```text
GET /onibus
GET /onibus/linha/:linha
GET /onibus/veiculo/:ordem
```

Exemplo de retorno:

```json
{
  "COLUMNS": ["DATAHORA", "ORDEM", "LINHA", "LATITUDE", "LONGITUDE", "VELOCIDADE"],
  "DATA": [
    ["08-13-2026 09:32:15", "20200", "004", -20.403260, -43.500880, 31.42]
  ]
}
```

## CSV

```text
GET /csv/onibus
GET /csv/onibus/linha/:linha
GET /csv/onibus/veiculo/:ordem
```

O CSV usa cabeçalho na primeira linha, vírgula como delimitador e CR+LF, conforme a documentação.

## Healthcheck

```text
GET /health
```

## Configuração opcional

- `BASE_METERS_PER_SECOND`: velocidade-base do motor de movimento. Padrão `8.33` (~30 km/h).
- `SNAPSHOT_SECONDS`: intervalo lógico dos snapshots. Padrão `5` segundos.
- `TZ`: timezone utilizado em `DATAHORA`. Padrão `America/Sao_Paulo`.
- `ROUTES_DIR`: diretório dos KMLs. Normalmente não precisa alterar.

## Observações

- A posição é interpolada ao longo do LineString de cada KML, e não gerada aleatoriamente.
- Ao chegar ao final do itinerário, o veículo retorna pelo mesmo trajeto.
- Veículos iniciam em posições diferentes para não ficarem sobrepostos.
- A velocidade varia deterministicamente e pode ficar em zero por períodos curtos para simular paradas.
- Apenas linhas que possuem KML são usadas na frota simulada.
