# UTF-8 Support in FABEO System

## Overview

The FABEO system now fully supports UTF-8 encoded text, including Portuguese characters (ã, á, ç, õ, ê, etc.).

## Implementation

### Changes Made

**File: `services/fabeo-service/main.py`**

1. **Python 2/3 Compatibility Check** (Lines 18-23)
   ```python
   # Python 2/3 compatibility
   try:
       unicode
   except NameError:
       # Python 3
       unicode = str
   ```

2. **UTF-8 Encoding in Encryption Function** (Lines 243-265)
   ```python
   # Handle message encoding properly for Unicode strings (Portuguese characters)
   # In Python 2.7, we need to encode Unicode strings to UTF-8 bytes first
   if isinstance(message, unicode):
       # Unicode string - encode to UTF-8 bytes for processing
       message_bytes = message.encode('utf-8')
   elif isinstance(message, str):
       # Already a byte string - use as is (assume UTF-8)
       message_bytes = message
   else:
       # Other types - convert to string first, then to UTF-8 bytes
       message_bytes = str(message)
   ```

3. **UTF-8 Decoding in Decryption Helper** (Line 453)
   ```python
   return plaintext_bytes.decode('utf-8')
   ```

## Supported Use Cases

### ✅ Fully Supported

1. **Portuguese Text in Data**
   - Encryption and decryption of text containing ã, á, ç, õ, ê, etc.
   - Example:
     ```json
     {
       "data": "Paciente tem condição crônica",
       "policy": "(1 and 2)"
     }
     ```

2. **Mixed ASCII and UTF-8 Text**
   - Example: "Patient has diabetes - Paciente tem diabetes"

3. **Special Characters**
   - Accented characters: á, é, í, ó, ú, à, è, ì, ò, ù
   - Tilde characters: ã, õ, ñ
   - Cedilla: ç
   - Circumflex: â, ê, î, ô, û

### ⚠️ Limited Support

**Portuguese Attribute Names in Policies**

While Portuguese text in the **data** field works perfectly, using Portuguese characters in **attribute names** within policies may encounter issues with FABEO's policy parser.

**Recommended Approach:**
- Use numeric attributes: `1`, `2`, `3`, etc.
- Use ASCII attribute names: `medico` (without accents), `doctor`, `nurse`
- Map Portuguese roles to numeric/ASCII identifiers in your application layer

Example of recommended pattern:
```json
{
  "data": "Dados sensíveis em português com acentuação",
  "policy": "(1 and 2)",
  "attributes": ["1", "2"]
}
```

Rather than:
```json
{
  "data": "Dados sensíveis",
  "policy": "(médico and enfermeiro)",  ⚠️ May not parse correctly
  "attributes": ["médico", "enfermeiro"]
}
```

## Testing

### Verification Script

The `verify_fabeo_setup.py` script includes a test with Portuguese text:

```python
encrypt_data = {
    "data": "Dados de teste para verificação",  # Contains ã and ç
    "policy": "(1 and 2)"
}
```

**Test Results:**
- ✅ All 6 tests passing (100% success rate)
- ✅ Portuguese characters encrypted and decrypted correctly

### Manual Testing

Test Portuguese text encryption:
```bash
curl -X POST http://localhost:8001/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Informação médica do paciente",
    "policy": "(1 and 2)"
  }'
```

Test decryption:
```bash
curl -X POST http://localhost:8001/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "ciphertext": "<encrypted_data>",
    "attributes": ["1", "2"]
  }'
```

## Technical Details

### Why Python 2.7 Requires Special Handling

In Python 2.7:
- Strings are byte strings by default (ASCII)
- Unicode strings are a separate type (`unicode`)
- Calling `str()` on a unicode object with non-ASCII characters causes `UnicodeEncodeError`

The fix:
1. Detect if the message is a `unicode` type
2. Explicitly encode to UTF-8 bytes: `message.encode('utf-8')`
3. Process the UTF-8 byte string through encryption
4. Decode from UTF-8 after decryption: `plaintext.decode('utf-8')`

### Encoding Flow

```
User Input (Unicode string)
    ↓
Encode to UTF-8 bytes
    ↓
XOR encryption (symmetric)
    ↓
Base64 encoding
    ↓
FABEO CP-ABE encryption
    ↓
Serialization to JSON
    ↓
[Transmission]
    ↓
Deserialization from JSON
    ↓
FABEO CP-ABE decryption
    ↓
Base64 decoding
    ↓
XOR decryption (symmetric)
    ↓
Decode from UTF-8 bytes
    ↓
Unicode string output
```

## Compatibility

- **FABEO Service**: Python 2.7 (Ubuntu 16.04)
- **Crypto API**: Python 3.13-slim
- **Character Encodings**: UTF-8 throughout the pipeline
- **Data Integrity**: Portuguese characters preserved through encrypt/decrypt cycle

## Limitations

1. **Policy Parser**: FABEO's policy parser may not support non-ASCII attribute names
2. **Python 2.7 Constraints**: Limited to what Python 2.7 can handle with UTF-8
3. **Attribute Hashing**: If using attribute-based encryption with Portuguese attribute names, consider normalizing with NFC before hashing

## Future Improvements

If full Portuguese attribute support is needed:

1. **Normalize Attributes**: Use Unicode normalization (NFC) before hashing
   ```python
   import unicodedata
   normalized_attr = unicodedata.normalize('NFC', attr)
   utf8_attr = normalized_attr.encode('utf-8')
   ```

2. **Attribute Mapping**: Create a mapping layer between Portuguese attribute names and ASCII identifiers
   ```python
   attr_map = {
       'médico': '1',
       'enfermeiro': '2',
       'paciente': '3'
   }
   ```

3. **Policy Translation**: Translate Portuguese policies to numeric policies before sending to FABEO

## References

- Main implementation: `services/fabeo-service/main.py`
- Verification script: `verify_fabeo_setup.py`
- FABEO documentation: `submodules/FABEO/README.md`
- Python 2.7 Unicode HOWTO: https://docs.python.org/2/howto/unicode.html
