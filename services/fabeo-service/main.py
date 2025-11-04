#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
FABEO Microservice
Simple HTTP server providing ABE encryption/decryption operations.
Python 2.7 compatible implementation.
"""

from flask import Flask, request, jsonify
import sys
import os
import json
import traceback
import logging
import base64
import pickle

# Python 2/3 compatibility
try:
    unicode
except NameError:
    # Python 3
    unicode = str

# Add FABEO to Python path
sys.path.insert(0, '/app/FABEO')

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for FABEO schemes
cp_abe_scheme = None
kp_abe_scheme = None
pk = None
msk = None

def initialize_fabeo():
    """Initialize FABEO schemes."""
    global cp_abe_scheme, kp_abe_scheme, pk, msk
    
    try:
        from charm.toolbox.pairinggroup import PairingGroup, GT
        from FABEO.fabeo22cp import FABEO22CPABE
        from FABEO.fabeo22kp import FABEO22KPABE
        
        # Store GT for later use
        global GT_class
        GT_class = GT
        
        # Initialize pairing group
        group = PairingGroup('SS512')
        logger.info("Initialized pairing group: %s", group)
        
        # Initialize schemes
        cp_abe_scheme = FABEO22CPABE(group)
        kp_abe_scheme = FABEO22KPABE(group)
        
        # Generate master keys
        pk, msk = cp_abe_scheme.setup()
        
        logger.info("FABEO22 schemes initialized successfully")
        return True
        
    except Exception as e:
        logger.error("Failed to initialize FABEO: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return False

def serialize_charm_object(obj, policy_str=None):
    """Serialize Charm objects using Charm's built-in serialization."""
    try:
        # Use Charm's group serialization for Elements
        if hasattr(obj, '__len__') and not isinstance(obj, str):
            # Handle dictionary/complex structures
            serialized_dict = {}
            for key, value in obj.items():
                if key == 'policy':
                    # Store the original policy string instead of the complex policy object
                    serialized_dict[key] = policy_str if policy_str else str(value)
                elif key == 'ct' and isinstance(value, dict):
                    # Handle the ciphertext dictionary specially
                    ct_serialized = {}
                    for attr, element in value.items():
                        if hasattr(element, '__class__') and 'pairing.Element' in str(element.__class__):
                            ct_serialized[attr] = {
                                'type': 'element',
                                'data': cp_abe_scheme.group.serialize(element).decode('latin1')
                            }
                        else:
                            ct_serialized[attr] = element
                    serialized_dict[key] = ct_serialized
                elif key == 'sk1' and isinstance(value, dict):
                    # Handle the sk1 dictionary (attribute -> Element mapping)
                    sk1_serialized = {}
                    for attr, element in value.items():
                        if hasattr(element, '__class__') and 'pairing.Element' in str(element.__class__):
                            sk1_serialized[attr] = {
                                'type': 'element',
                                'data': cp_abe_scheme.group.serialize(element).decode('latin1')
                            }
                        else:
                            sk1_serialized[attr] = element
                    serialized_dict[key] = sk1_serialized
                elif hasattr(value, '__class__') and 'pairing.Element' in str(value.__class__):
                    # Serialize Charm Elements using group
                    serialized_dict[key] = {
                        'type': 'element',
                        'data': cp_abe_scheme.group.serialize(value).decode('latin1')
                    }
                elif isinstance(value, list):
                    # Handle lists (e.g., attr_list)
                    serialized_dict[key] = value
                elif isinstance(value, dict):
                    # Recursively serialize nested dictionaries
                    nested_serialized = {}
                    for nested_key, nested_value in value.items():
                        if hasattr(nested_value, '__class__') and 'pairing.Element' in str(nested_value.__class__):
                            nested_serialized[nested_key] = {
                                'type': 'element',
                                'data': cp_abe_scheme.group.serialize(nested_value).decode('latin1')
                            }
                        else:
                            nested_serialized[nested_key] = nested_value
                    serialized_dict[key] = nested_serialized
                else:
                    try:
                        # Test if value is JSON serializable
                        import json
                        json.dumps(value)
                        serialized_dict[key] = value
                    except (TypeError, ValueError):
                        # Skip non-serializable values
                        logger.warning("Skipping non-serializable key: %s of type %s", key, type(value))
                        continue
            
            # Convert to JSON string and then base64
            import json
            json_str = json.dumps(serialized_dict)
            return base64.b64encode(json_str.encode('utf-8')).decode('ascii')
        else:
            # Handle single elements
            if hasattr(obj, '__class__') and 'pairing.Element' in str(obj.__class__):
                data = cp_abe_scheme.group.serialize(obj).decode('latin1')
                element_dict = {'type': 'single_element', 'data': data}
                json_str = json.dumps(element_dict)
                return base64.b64encode(json_str.encode('utf-8')).decode('ascii')
            else:
                # Fallback to regular serialization
                pickled = pickle.dumps(obj)
                return base64.b64encode(pickled).decode('ascii')
                
    except Exception as e:
        logger.error("Serialization error: %s", e)
        logger.error("Object type: %s", type(obj))
        return None

def deserialize_charm_object(data):
    """Deserialize base64 string back to Charm object."""
    try:
        # Decode from base64
        json_str = base64.b64decode(data.encode('ascii')).decode('utf-8')
        
        import json
        obj_dict = json.loads(json_str)
        
        if obj_dict.get('type') == 'single_element':
            # Single element
            element_data = obj_dict['data'].encode('latin1')
            return cp_abe_scheme.group.deserialize(element_data)
        elif isinstance(obj_dict, dict):
            # Complex structure - reconstruct
            reconstructed = {}
            for key, value in obj_dict.items():
                if key == 'ct' and isinstance(value, dict):
                    # Handle the ciphertext dictionary specially
                    ct_reconstructed = {}
                    for attr, element_data in value.items():
                        if isinstance(element_data, dict) and element_data.get('type') == 'element':
                            # Deserialize Charm Element
                            data_bytes = element_data['data'].encode('latin1')
                            ct_reconstructed[attr] = cp_abe_scheme.group.deserialize(data_bytes)
                        else:
                            ct_reconstructed[attr] = element_data
                    reconstructed[key] = ct_reconstructed
                elif key == 'sk1' and isinstance(value, dict):
                    # Handle the sk1 dictionary specially
                    sk1_reconstructed = {}
                    for attr, element_data in value.items():
                        if isinstance(element_data, dict) and element_data.get('type') == 'element':
                            # Deserialize Charm Element
                            data_bytes = element_data['data'].encode('latin1')
                            sk1_reconstructed[attr] = cp_abe_scheme.group.deserialize(data_bytes)
                        else:
                            sk1_reconstructed[attr] = element_data
                    reconstructed[key] = sk1_reconstructed
                elif isinstance(value, dict) and value.get('type') == 'element':
                    # Deserialize Charm Element
                    element_data = value['data'].encode('latin1')
                    reconstructed[key] = cp_abe_scheme.group.deserialize(element_data)
                elif isinstance(value, dict):
                    # Check if it's a nested dictionary of elements
                    nested_reconstructed = {}
                    has_elements = False
                    for nested_key, nested_value in value.items():
                        if isinstance(nested_value, dict) and nested_value.get('type') == 'element':
                            data_bytes = nested_value['data'].encode('latin1')
                            nested_reconstructed[nested_key] = cp_abe_scheme.group.deserialize(data_bytes)
                            has_elements = True
                        else:
                            nested_reconstructed[nested_key] = nested_value
                    reconstructed[key] = nested_reconstructed if has_elements else value
                else:
                    reconstructed[key] = value
            return reconstructed
        else:
            # Fallback to pickle
            pickled = base64.b64decode(data.encode('ascii'))
            return pickle.loads(pickled)
            
    except Exception as e:
        logger.error("Deserialization error: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "fabeo-service"})

@app.route('/encrypt', methods=['POST'])
def encrypt():
    """Encrypt data using CP-ABE."""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data or 'policy' not in data:
            return jsonify({"error": "Missing required fields: message, policy"}), 400
        
        message = data['message']
        policy = data['policy']
        
        # Debug logging to check types
        logger.info("Encrypting message with policy: %s", policy)
        logger.info("Policy type: %s", type(policy))
        logger.info("Message type: %s", type(message))
        logger.info("Message content: %s", repr(message))
        
        # Ensure policy is a string (handle Unicode in Python 2.7)
        if isinstance(policy, unicode):
            policy = policy.encode('utf-8')
        elif not isinstance(policy, str):
            policy = str(policy)
        
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
        
        logger.info("After conversion - Policy type: %s", type(policy))
        logger.info("After conversion - Message bytes length: %s", len(message_bytes))
        logger.info("Public key type: %s", type(pk))
        logger.info("Scheme type: %s", type(cp_abe_scheme))
        
        # Convert message to group element in GT using KEM approach
        # In FABEO, we encrypt a random GT element and use its hash for symmetric encryption
        
        # Generate a random GT element as the "symmetric key"
        random_gt_element = cp_abe_scheme.group.random(GT_class)
        logger.info("Random GT element type: %s", type(random_gt_element))
        
        # Use the hash of this GT element for simple symmetric encryption
        import hashlib
        
        # Create a key stream from the GT element
        key_material = hashlib.sha256(str(random_gt_element)).digest()
        
        # message_bytes already prepared above (UTF-8 encoded)
        # Expand key material to message length
        key_stream = ""
        for i in range(len(message_bytes)):
            key_stream += key_material[i % len(key_material)]
        
        # XOR encrypt
        symmetric_ciphertext = ""
        for i in range(len(message_bytes)):
            symmetric_ciphertext += chr(ord(message_bytes[i]) ^ ord(key_stream[i]))
        
        # Base64 encode the result
        aes_ciphertext = base64.b64encode(symmetric_ciphertext).decode('ascii')
        
        # Perform CP-ABE encryption on the GT element (this is the KEM part)
        # Use the FABEO encrypt method directly with the random GT element
        ciphertext = cp_abe_scheme.encrypt(pk, random_gt_element, policy)
        
        # Add the symmetric ciphertext to the result
        ciphertext['aes_ciphertext'] = aes_ciphertext
        ciphertext['original_policy_string'] = policy  # Store the original policy string for reference
        
        # Serialize ciphertext for transport - but keep the policy object intact
        serialized_ct = serialize_charm_object(ciphertext, policy)
        
        if serialized_ct is None:
            return jsonify({"error": "Failed to serialize ciphertext"}), 500
        
        result = {
            "success": True,
            "ciphertext": serialized_ct,
            "policy": policy,
            "scheme": "FABEO22-CP-ABE"
        }
        
        logger.info("Encryption successful")
        return jsonify(result)
        
    except Exception as e:
        logger.error("Encryption error: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/decrypt', methods=['POST'])
def decrypt():
    """Decrypt data using CP-ABE with attributes (legacy/testing method)."""
    try:
        data = request.get_json()
        
        if not data or 'ciphertext' not in data or 'attributes' not in data:
            return jsonify({"error": "Missing required fields: ciphertext, attributes"}), 400
        
        ciphertext_str = data['ciphertext']
        attributes = data['attributes']
        
        logger.info("Decrypting with attributes: %s", attributes)
        
        # IMPORTANT: Charm's policy parser converts all attributes to UPPERCASE
        # So we need to uppercase attributes here too for consistency
        attributes_upper = [str(attr).upper() for attr in attributes]
        
        logger.info("Uppercased attributes for Charm compatibility: %s", attributes_upper)
        
        # Deserialize ciphertext
        ciphertext = deserialize_charm_object(ciphertext_str)
        if ciphertext is None:
            return jsonify({"error": "Failed to deserialize ciphertext"}), 400
        
        # If policy is a string, recreate it properly
        if 'policy' in ciphertext:
            policy_val = ciphertext['policy']
            policy_type_name = type(policy_val).__name__
            if policy_type_name in ['str', 'unicode']:
                logger.info("Policy is string type (%s), recreating policy tree...", policy_type_name)
                policy_str = str(policy_val)
                ciphertext['policy'] = cp_abe_scheme.util.createPolicy(policy_str)
        
        # Generate key for uppercased attributes
        key = cp_abe_scheme.keygen(pk, msk, attributes_upper)
        
        # Perform decryption to get the GT element
        gt_element = cp_abe_scheme.decrypt(pk, ciphertext, key)
        
        if gt_element is None:
            return jsonify({"error": "Decryption failed - policy not satisfied by attributes"}), 400
        
        # Extract and decrypt the symmetric ciphertext
        if 'aes_ciphertext' not in ciphertext:
            return jsonify({"error": "Invalid ciphertext format - missing AES component"}), 400
        
        plaintext = _decrypt_symmetric(ciphertext['aes_ciphertext'], gt_element)
        
        if plaintext is None:
            return jsonify({"error": "Failed to decrypt symmetric ciphertext"}), 500
        
        result = {
            "success": True,
            "plaintext": plaintext,
            "attributes": attributes
        }
        
        logger.info("Decryption successful")
        return jsonify(result)
        
    except Exception as e:
        logger.error("Decryption error: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/decrypt_with_key', methods=['POST'])
def decrypt_with_key():
    """Decrypt data using CP-ABE with pre-generated user key (recommended approach)."""
    try:
        data = request.get_json()
        
        if not data or 'ciphertext' not in data or 'user_key' not in data:
            return jsonify({"error": "Missing required fields: ciphertext, user_key"}), 400
        
        ciphertext_str = data['ciphertext']
        user_key_str = data['user_key']
        
        logger.info("Decrypting with pre-generated user key")
        
        # Deserialize ciphertext
        ciphertext = deserialize_charm_object(ciphertext_str)
        if ciphertext is None:
            return jsonify({"error": "Failed to deserialize ciphertext"}), 400
        
        # Deserialize user key
        key = deserialize_charm_object(user_key_str)
        if key is None:
            return jsonify({"error": "Failed to deserialize user key"}), 400
        
        # If policy is a string, recreate it properly
        if 'policy' in ciphertext:
            policy_val = ciphertext['policy']
            policy_type_name = type(policy_val).__name__
            if policy_type_name in ['str', 'unicode']:
                logger.info("Policy is string type (%s), recreating policy tree...", policy_type_name)
                policy_str = str(policy_val)
                ciphertext['policy'] = cp_abe_scheme.util.createPolicy(policy_str)
        
        # Debug: Log key attributes and ciphertext attributes
        if 'attr_list' in key:
            logger.info("User key attributes: %s", key['attr_list'])
        if 'ct' in ciphertext:
            logger.info("Ciphertext policy attributes: %s", ciphertext['ct'].keys())
        
        # Perform decryption to get the GT element
        gt_element = cp_abe_scheme.decrypt(pk, ciphertext, key)
        
        if gt_element is None:
            return jsonify({"error": "Decryption failed - policy not satisfied by user key"}), 400
        
        # Extract and decrypt the symmetric ciphertext
        if 'aes_ciphertext' not in ciphertext:
            return jsonify({"error": "Invalid ciphertext format - missing AES component"}), 400
        
        plaintext = _decrypt_symmetric(ciphertext['aes_ciphertext'], gt_element)
        
        if plaintext is None:
            return jsonify({"error": "Failed to decrypt symmetric ciphertext"}), 500
        
        result = {
            "success": True,
            "plaintext": plaintext
        }
        
        logger.info("Key-based decryption successful")
        return jsonify(result)
        
    except Exception as e:
        logger.error("Key-based decryption error: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def _decrypt_symmetric(aes_ciphertext, gt_element):
    """Helper function to decrypt symmetric ciphertext using GT element."""
    try:
        import hashlib
        key_material = hashlib.sha256(str(gt_element)).digest()
        
        # Decode the ciphertext
        symmetric_ciphertext = base64.b64decode(aes_ciphertext)
        
        # Expand key material to ciphertext length
        key_stream = ""
        for i in range(len(symmetric_ciphertext)):
            key_stream += key_material[i % len(key_material)]
        
        # XOR decrypt
        plaintext_bytes = ""
        for i in range(len(symmetric_ciphertext)):
            plaintext_bytes += chr(ord(symmetric_ciphertext[i]) ^ ord(key_stream[i]))
        
        return plaintext_bytes.decode('utf-8')
        
    except Exception as e:
        logger.error("Symmetric decryption error: %s", e)
        return None

@app.route('/keygen', methods=['POST'])
def generate_key():
    """Generate a key for given attributes."""
    try:
        data = request.get_json()
        
        if not data or 'attributes' not in data:
            return jsonify({"error": "Missing required field: attributes"}), 400
        
        attributes = data['attributes']
        
        logger.info("Generating key for attributes: %s", attributes)
        
        # IMPORTANT: Charm's policy parser converts all attributes to UPPERCASE
        # So we need to uppercase attributes here too for consistency
        # This enables semantic attributes like 'doctor', 'nurse' to work
        attributes_upper = [str(attr).upper() for attr in attributes]
        
        logger.info("Uppercased attributes for Charm compatibility: %s", attributes_upper)
        
        # Generate key with uppercased attributes
        key = cp_abe_scheme.keygen(pk, msk, attributes_upper)
        
        # Serialize key for transport
        serialized_key = serialize_charm_object(key)
        
        if serialized_key is None:
            return jsonify({"error": "Failed to serialize key"}), 500
        
        result = {
            "success": True,
            "key": serialized_key,
            "attributes": attributes,
            "scheme": "FABEO22-CP-ABE"
        }
        
        logger.info("Key generation successful")
        return jsonify(result)
        
    except Exception as e:
        logger.error("Key generation error: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/setup', methods=['POST'])
def setup_keys():
    """Generate new master keys."""
    try:
        global pk, msk
        
        logger.info("Generating new master keys")
        
        # Generate new master keys
        pk, msk = cp_abe_scheme.setup()
        
        # Serialize public key for response (master secret key stays private)
        serialized_pk = serialize_charm_object(pk)
        
        if serialized_pk is None:
            return jsonify({"error": "Failed to serialize public key"}), 500
        
        result = {
            "success": True,
            "public_key": serialized_pk,
            "message": "New master keys generated successfully"
        }
        
        logger.info("Master key generation successful")
        return jsonify(result)
        
    except Exception as e:
        logger.error("Setup error: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/info', methods=['GET'])
def get_info():
    """Get service information."""
    return jsonify({
        "service": "FABEO Microservice",
        "version": "1.0.0",
        "schemes": ["FABEO22-CP-ABE", "FABEO22-KP-ABE"],
        "python_version": sys.version,
        "available": pk is not None
    })

if __name__ == '__main__':
    logger.info("Starting FABEO microservice...")
    
    if initialize_fabeo():
        logger.info("FABEO initialized successfully")
        app.run(host='0.0.0.0', port=8002, debug=False)
    else:
        logger.error("Failed to initialize FABEO")
        sys.exit(1)