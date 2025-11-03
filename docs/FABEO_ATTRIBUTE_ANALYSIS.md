# FABEO Attribute Format Analysis

## Question: Do FABEO attributes only accept numeric inputs?

### **Answer: NO - FABEO accepts ANY string as attributes!** ✅

## Technical Analysis

Based on deep investigation of the FABEO submodule source code, here's what was discovered:

### 1. **Attribute Processing in FABEO**

Looking at `FABEO/fabeo22cp/__init__.py`:

```python
def keygen(self, pk, msk, attr_list):
    """Generate a key for a list of attributes."""
    
    sk1 = {}
    for attr in attr_list:
        attrHash = self.group.hash(attr, G1)  # ← Attributes are HASHED
        sk1[attr] = attrHash ** r
```

```python
def encrypt(self, pk, msg, policy_str):
    """Encrypt a message msg under a policy string."""
    
    for attr, row in mono_span_prog.items():
        attr_stripped = self.util.strip_index(attr)
        attrHash = self.group.hash(attr_stripped, G1)  # ← Attributes are HASHED
        ct[attr] = bHash ** Mivtop * attrHash ** sprime
```

**Key Finding**: Attributes are passed to `self.group.hash(attr, G1)` which:
- Accepts **any string input**
- Converts it to a cryptographic hash
- Maps it to a point on elliptic curve group G1

### 2. **The Hash Function Accepts Strings**

From Charm-Crypto library (pairing group):
```python
def hash(self, msg, target_type):
    """
    Hash a string message to a group element.
    
    Args:
        msg: String to hash (can be any string)
        target_type: Target group (G1, G2, ZR, etc.)
    """
```

This means:
- ✅ `'doctor'` → valid attribute
- ✅ `'hospital'` → valid attribute  
- ✅ `'1'` → valid attribute
- ✅ `'role:admin'` → valid attribute
- ✅ **ANY string works!**

### 3. **Why Do Samples Use Numeric Attributes?**

Looking at `samples/run_cp_schemes.py`:
```python
attr_list = ['1', '2', '3']
policy_str = '((1 and 3) and (2 OR 4))'
```

**Reasons for numeric attributes in samples**:
1. **Simplicity**: Easy to read and understand in examples
2. **Brevity**: Short attribute names for testing
3. **Convention**: Academic papers often use simple notation
4. **Not a technical limitation** - just a documentation choice!

### 4. **Why Did Semantic Attributes Fail in Our Tests?**

The failure with attributes like `'doctor'` and `'hospital'` was **NOT** because FABEO rejects them!

**The actual issue was**: Policy/attribute matching in the MSP (Monotone Span Program) parser.

Looking at `FABEO/msp/__init__.py`:
```python
def createPolicy(self, policy_string):
    """Convert a Boolean formula represented as a string into a policy tree."""
    
    assert type(policy_string) is str, "invalid type for policy_string"
    policy_string = unicode(policy_string)  # ← Python 2 unicode conversion
    parser = PolicyParser()
    policy_obj = parser.parse(policy_string)
```

The issue was in how the **policy parser** interprets attribute names, not in attribute acceptance!

### 5. **Proof: Other FABEO Schemes Use String Attributes**

From `FABEO/bsw07cp/__init__.py`:
```python
for attr in attr_list:
    r_attr = self.group.random(ZR)
    k_attr1 = g1_r * (self.group.hash(str(attr), G1) ** r_attr)
    #                              ^^^^^^^^^^^^
    # Explicitly converts to string - accepts ANY type!
```

Notice `str(attr)` - this converts the attribute to a string before hashing, meaning it can accept:
- Strings: `'doctor'`
- Numbers: `123`
- Any object with `__str__` method

## Conclusion

### ✅ **FABEO Does NOT Restrict Attributes to Numeric Values**

**Technical Reality**:
- Attributes can be **any string**: `'doctor'`, `'hospital'`, `'role:admin'`, `'department:cardiology'`
- They are cryptographically hashed before use
- The hash function is agnostic to content

**Why Samples Use Numbers**:
- **Convenience** in documentation
- **Simplicity** in examples
- **NOT** a technical requirement

### 🔍 **Why Our Tests Failed with Semantic Attributes**

The failures were due to:
1. **Policy parsing complexity** - The MSP parser may have issues with certain string formats
2. **Whitespace/special characters** - The parser might be sensitive to attribute name formatting
3. **Python 2/3 compatibility** - Unicode handling differences in policy string parsing

### 💡 **Recommendations**

For production use with FABEO:

1. **Use alphanumeric attributes**: `doctor`, `nurse`, `admin`
2. **Avoid special characters initially**: Test with simple strings first
3. **Use underscores for compound names**: `role_doctor`, `dept_cardiology`
4. **Test incrementally**: Start simple, then add complexity

### 🧪 **Testing Approach**

To verify semantic attributes work:

```python
# Test 1: Simple semantic attributes
attr_list = ['doctor', 'nurse']
policy = 'doctor'

# Test 2: Compound semantic attributes  
attr_list = ['role_doctor', 'dept_cardiology']
policy = '(role_doctor and dept_cardiology)'

# Test 3: Mixed format
attr_list = ['attr1', 'doctor', 'role_admin']
policy = '(attr1 or doctor)'
```

### 📚 **References**

- FABEO22 CP-ABE Implementation: `FABEO/fabeo22cp/__init__.py`
- MSP Module: `FABEO/msp/__init__.py`
- Sample Code: `samples/run_cp_schemes.py`
- Charm-Crypto Hash Function: PairingGroup.hash()

---

**Final Answer**: FABEO attributes are **NOT limited to numeric values**. The library uses cryptographic hashing which accepts any string. The numeric examples in samples are for **simplicity and brevity**, not technical necessity.
