/* asn1hex-1.2.13.js (c) 2012-2022 Kenji Urushima | kjur.github.io/jsrsasign/license
 */
/*
 * asn1hex.js - Hexadecimal represented ASN.1 string library
 *
 * Copyright (c) 2010-2022 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * https://kjur.github.io/jsrsasign/license/
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name asn1hex-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version jsrsasign 10.5.12 asn1hex 1.2.13 (2022-Mar-13)
 * @license <a href="https://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/*
 * MEMO:
 *   f('3082025b02...', 2) ... 82025b ... 3bytes
 *   f('020100', 2) ... 01 ... 1byte
 *   f('0203001...', 2) ... 03 ... 1byte
 *   f('02818003...', 2) ... 8180 ... 2bytes
 *   f('3080....0000', 2) ... 80 ... -1
 *
 *   Requirements:
 *   - ASN.1 type octet length MUST be 1. 
 *     (i.e. ASN.1 primitives like SET, SEQUENCE, INTEGER, OCTETSTRING ...)
 */

/**
 * ASN.1 DER encoded hexadecimal string utility class
 * @name ASN1HEX
 * @class ASN.1 DER encoded hexadecimal string utility class
 * @since jsrsasign 1.1
 * @description
 * This class provides a parser for hexadecimal string of
 * DER encoded ASN.1 binary data.
 * Here are major methods of this class.
 * <ul>
 * <li><b>ACCESS BY POSITION</b>
 *   <ul>
 *   <li>{@link ASN1HEX.getTLV} - get ASN.1 TLV at specified position</li>
 *   <li>{@link ASN1HEX.getTLVblen} - get byte length of ASN.1 TLV at specified position</li>
 *   <li>{@link ASN1HEX.getV} - get ASN.1 V at specified position</li>
 *   <li>{@link ASN1HEX.getVblen} - get integer ASN.1 L at specified position</li>
 *   <li>{@link ASN1HEX.getVidx} - get ASN.1 V position from its ASN.1 TLV position</li>
 *   <li>{@link ASN1HEX.getL} - get hexadecimal ASN.1 L at specified position</li>
 *   <li>{@link ASN1HEX.getLblen} - get byte length for ASN.1 L(length) bytes</li>
 *   </ul>
 * </li>
 * <li><b>ACCESS FOR CHILD ITEM</b>
 *   <ul>
 *   <li>{@link ASN1HEX.getNthChildIdx} - get nth child index at specified position</li>
 *   <li>{@link ASN1HEX.getChildIdx} - get indexes of children</li>
 *   <li>{@link ASN1HEX.getNextSiblingIdx} - get position of next sibling (DEPRECATED)</li>
 *   </ul>
 * </li>
 * <li><b>ACCESS NESTED ASN.1 STRUCTURE</b>
 *   <ul>
 *   <li>{@link ASN1HEX.getTLVbyList} - get ASN.1 TLV at specified list index</li>
 *   <li>{@link ASN1HEX.getVbyList} - get ASN.1 V at specified nth list index with checking expected tag</li>
 *   <li>{@link ASN1HEX.getIdxbyList} - get index at specified list index</li>
 *   </ul>
 * </li>
 * <li><b>(NEW)ACCESS NESTED ASN.1 STRUCTURE</b>
 *   <ul>
 *   <li>{@link ASN1HEX.getTLVbyListEx} - get ASN.1 TLV at specified list index</li>
 *   <li>{@link ASN1HEX.getVbyListEx} - get ASN.1 V at specified nth list index with checking expected tag</li>
 *   <li>{@link ASN1HEX.getIdxbyListEx} - get index at specified list index</li>
 *   </ul>
 * </li>
 * <li><b>UTILITIES</b>
 *   <ul>
 *   <li>{@link ASN1HEX.dump} - dump ASN.1 structure</li>
 *   <li>{@link ASN1HEX.isContextTag} - check if a hexadecimal tag is a specified ASN.1 context specific tag</li>
 *   <li>{@link ASN1HEX.isASN1HEX} - simple ASN.1 DER hexadecimal string checker</li>
 *   <li>{@link ASN1HEX.checkStrictDER} - strict ASN.1 DER hexadecimal string checker</li>
 *   <li>{@link ASN1HEX.hextooidstr} - convert hexadecimal string of OID to dotted integer list</li>
 *   </ul>
 * </li>
 * </ul>
 */
var ASN1HEX = new function() {
};

/**
 * get byte length for ASN.1 L(length) bytes<br/>
 * @name getLblen
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index
 * @return byte length for ASN.1 L(length) bytes
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 * @example
 * ASN1HEX.getLblen('020100', 0) &rarr; 1 for '01'
 * ASN1HEX.getLblen('020200', 0) &rarr; 1 for '02'
 * ASN1HEX.getLblen('02818003...', 0) &rarr; 2 for '8180'
 * ASN1HEX.getLblen('0282025b03...', 0) &rarr; 3 for '82025b'
 * ASN1HEX.getLblen('0280020100...', 0) &rarr; -1 for '80' BER indefinite length
 * ASN1HEX.getLblen('02ffab...', 0) &rarr; -2 for malformed ASN.1 length
 */
ASN1HEX.getLblen = function(s, idx) {
    if (s.substr(idx + 2, 1) != '8') return 1;
    var i = parseInt(s.substr(idx + 3, 1));
    if (i == 0) return -1;             // length octet '80' indefinite length
    if (0 < i && i < 10) return i + 1; // including '8?' octet;
    return -2;                         // malformed format
};

/**
 * get hexadecimal string for ASN.1 L(length) bytes<br/>
 * @name getL
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index to get L of ASN.1 object
 * @return {String} hexadecimal string for ASN.1 L(length) bytes
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 */
ASN1HEX.getL = function(s, idx) {
    var len = ASN1HEX.getLblen(s, idx);
    if (len < 1) return '';
    return s.substr(idx + 2, len * 2);
};

/**
 * get integer value of ASN.1 length for ASN.1 data<br/>
 * @name getVblen
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index
 * @return {Number} ASN.1 L(length) integer value
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 */
/*
 getting ASN.1 length value at the position 'idx' of
 hexa decimal string 's'.
 f('3082025b02...', 0) ... 82025b ... ???
 f('020100', 0) ... 01 ... 1
 f('0203001...', 0) ... 03 ... 3
 f('02818003...', 0) ... 8180 ... 128
 */
ASN1HEX.getVblen = function(s, idx) {
    var hLen, bi;
    hLen = ASN1HEX.getL(s, idx);
    if (hLen == '') return -1;
    if (hLen.substr(0, 1) === '8') {
        bi = new BigInteger(hLen.substr(2), 16);
    } else {
        bi = new BigInteger(hLen, 16);
    }
    return bi.intValue();
};

/**
 * get ASN.1 value starting string position for ASN.1 object refered by index 'idx'.
 * @name getVidx
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 */
ASN1HEX.getVidx = function(s, idx) {
    var l_len = ASN1HEX.getLblen(s, idx);
    if (l_len < 0) return l_len;
    return idx + (l_len + 1) * 2;
};

/**
 * get hexadecimal string of ASN.1 V(value)<br/>
 * @name getV
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index
 * @return {String} hexadecimal string of ASN.1 value.
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 */
ASN1HEX.getV = function(s, idx) {
    var idx1 = ASN1HEX.getVidx(s, idx);
    var blen = ASN1HEX.getVblen(s, idx);
    return s.substr(idx1, blen * 2);
};

/**
 * get hexadecimal string of ASN.1 TLV at<br/>
 * @name getTLV
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index
 * @return {String} hexadecimal string of ASN.1 TLV.
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 */
ASN1HEX.getTLV = function(s, idx) {
    return s.substr(idx, 2) + ASN1HEX.getL(s, idx) + ASN1HEX.getV(s, idx);
};

/**
 * get byte length of ASN.1 TLV at specified string index<br/>
 * @name getTLVblen
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index to get ASN.1 TLV byte length
 * @return {Number} byte length of ASN.1 TLV
 * @since jsrsasign 9.1.5 asn1hex 1.1.11
 *
 * @description
 * This method returns a byte length of ASN.1 TLV at
 * specified string index.
 *
 * @example
 *                        v string indx=42
 * ASN1HEX.getTLVblen("...1303616161...", 42) &rarr; 10 (PrintableString 'aaa')
 */
ASN1HEX.getTLVblen = function(h, idx) {
    return 2 + ASN1HEX.getLblen(h, idx) * 2 + ASN1HEX.getVblen(h, idx) * 2;
};

// ========== sibling methods ================================

/**
 * get next sibling starting index for ASN.1 object string (DEPRECATED)<br/>
 * @name getNextSiblingIdx
 * @memberOf ASN1HEX
 * @function
 * @param {String} s hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx string index
 * @return {Number} next sibling starting index for ASN.1 object string
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 * @deprecated jsrsasign 9.1.5 asn1hex 1.2.5 Please use {@link ASN1HEX.getTLVblen}
 *
 * @example
 * SEQUENCE { INTEGER 3, INTEGER 4 }
 * 3006
 *     020103 :idx=4
 *           020104 :next sibling idx=10
 * getNextSiblingIdx("3006020103020104", 4) & rarr 10
 */
ASN1HEX.getNextSiblingIdx = function(s, idx) {
    var idx1 = ASN1HEX.getVidx(s, idx);
    var blen = ASN1HEX.getVblen(s, idx);
    return idx1 + blen * 2;
};

// ========== children methods ===============================
/**
 * get array of string indexes of child ASN.1 objects<br/>
 * @name getChildIdx
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx start string index of ASN.1 object
 * @return {Array of Number} array of indexes for childen of ASN.1 objects
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 * @description
 * This method returns array of integers for a concatination of ASN.1 objects
 * in a ASN.1 value. As for BITSTRING, one byte of unusedbits is skipped.
 * As for other ASN.1 simple types such as INTEGER, OCTET STRING or PRINTABLE STRING,
 * it returns a array of a string index of its ASN.1 value.<br/>
 * NOTE: Since asn1hex 1.1.7 of jsrsasign 6.1.2, Encapsulated BitString is supported.
 * @example
 * ASN1HEX.getChildIdx("0203012345", 0) &rArr; [4] // INTEGER 012345
 * ASN1HEX.getChildIdx("1303616161", 0) &rArr; [4] // PrintableString aaa
 * ASN1HEX.getChildIdx("030300ffff", 0) &rArr; [6] // BITSTRING ffff (unusedbits=00a)
 * ASN1HEX.getChildIdx("3006020104020105", 0) &rArr; [4, 10] // SEQUENCE(INT4,INT5)
 */
ASN1HEX.getChildIdx = function(h, idx) {
    var _ASN1HEX = ASN1HEX;
    var a = [];
    var idxStart, totalChildBlen, currentChildBlen;

    idxStart = _ASN1HEX.getVidx(h, idx);
    totalChildBlen = _ASN1HEX.getVblen(h, idx) * 2;
    if (h.substr(idx, 2) == "03") {  // BITSTRING without unusedbits
	idxStart += 2;
	totalChildBlen -= 2;
    }

    currentChildBlen = 0;
    var i = idxStart;
    while (currentChildBlen <= totalChildBlen) {
	var tlvBlen = _ASN1HEX.getTLVblen(h, i);
	currentChildBlen += tlvBlen;
	if (currentChildBlen <= totalChildBlen) a.push(i);
	i += tlvBlen;
	if (currentChildBlen >= totalChildBlen) break;
    }
    return a;
};

/**
 * get string index of nth child object of ASN.1 object refered by h, idx<br/>
 * @name getNthChildIdx
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 DER encoded data
 * @param {Number} idx start string index of ASN.1 object
 * @param {Number} nth for child
 * @return {Number} string index of nth child.
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 */
ASN1HEX.getNthChildIdx = function(h, idx, nth) {
    var a = ASN1HEX.getChildIdx(h, idx);
    return a[nth];
};

// ========== decendant methods ==============================
/**
 * get string index of nth child object of ASN.1 object refered by h, idx<br/>
 * @name getIdxbyList
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 DER encoded data
 * @param {Number} currentIndex start string index of ASN.1 object
 * @param {Array of Number} nthList array list of nth
 * @param {String} checkingTag (OPTIONAL) string of expected ASN.1 tag for nthList 
 * @return {Number} string index refered by nthList
 * @since jsrsasign 7.1.4 asn1hex 1.1.10.
 * @description
 * @example
 * The "nthList" is a index list of structured ASN.1 object
 * reference. Here is a sample structure and "nthList"s which
 * refers each objects.
 *
 * SQUENCE               - 
 *   SEQUENCE            - [0]
 *     IA5STRING 000     - [0, 0]
 *     UTF8STRING 001    - [0, 1]
 *   SET                 - [1]
 *     IA5STRING 010     - [1, 0]
 *     UTF8STRING 011    - [1, 1]
 */
ASN1HEX.getIdxbyList = function(h, currentIndex, nthList, checkingTag) {
    var _ASN1HEX = ASN1HEX;
    var firstNth, a;
    if (nthList.length == 0) {
	if (checkingTag !== undefined) {
            if (h.substr(currentIndex, 2) !== checkingTag) return -1;
	}
        return currentIndex;
    }
    firstNth = nthList.shift();
    a = _ASN1HEX.getChildIdx(h, currentIndex);
    if (firstNth >= a.length) return -1;

    return _ASN1HEX.getIdxbyList(h, a[firstNth], nthList, checkingTag);
};

/**
 * get string index of nth child object of ASN.1 object refered by h, idx<br/>
 * @name getIdxbyListEx
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 DER encoded data
 * @param {Number} currentIndex start string index of ASN.1 object
 * @param {Array of Object} nthList array list of nth index value or context specific tag string (ex. "[0]")
 * @param {String} checkingTag (OPTIONAL) string of expected ASN.1 tag for nthList 
 * @return {Number} string index refered by nthList. return -1 if not found
 * @since jsrsasign 8.0.21 asn1hex 1.2.2
 * @see <a href="https://github.com/kjur/jsrsasign/wiki/Tutorial-for-accessing-deep-inside-of-ASN.1-structure-by-using-new-ASN1HEX.getIdxbyListEx">ASN1HEX.getIdxbyListEx tutorial wiki page</a>
 *
 * @description
 * This method returns the string index in h specified by currentIndex and
 * nthList. This is useful to dig into a deep structured ASN.1 object
 * by indexes called nthList. 
 * <br/>
 * A nthList consists of a position number in children of ASN.1
 * structured data or a context specific tag string (ex. "[1]").
 * Here is a sample deep structured ASN.1 data and
 * nthLists referring decendent objects.
 * <blockquote><pre>
 * SQUENCE               - referring nthList is below:
 *   SEQUENCE            - [0]
 *     IA5STRING "a1"    - [0, 0]
 *     UTF8STRING "a2"   - [0, 1]
 *   SET                 - [1]
 *     IA5STRING "b1"    - [1, 0]
 *     UTF8STRING "b2"   - [1, 1]
 *     [0] "b3"          - [1, "[0]"] // optional since context tag
 *     [1] "b4"          - [1, "[1]"] // optional since context tag
 *     IA5STRING "b5"    - [1, 2] // context is skipped. next is 2
 *     UTF8STRING "b6"   - [1, 3]
 * </pre></blockquote>
 *
 * <br/>
 * This method can dig into ASN.1 object encapsulated by
 * OctetString or BitString with unused bits.
 *
 * @example
 * 3014 seq idx=0
 *   3012 seq idx=4
 *     020101 int:1 idx=8
 *     020102 int:2 idx=14
 *     800103 [0]:3 idx=20
 *     810104 [1]:4 idx=26
 *     020105 int:5 idx=32
 *     020106 int:6 idx=38
 * h = "30140412020101020102800103810104020105020106";
 * ASN1HEX.getIdxbyListEx(h, 0, [0, "[0]"]) &rarr; 16
 * ASN1HEX.getIdxbyListEx(h, 0, [0, 2]) &rarr; 28
 * ASN1HEX.getIdxbyListEx(h, 0, [0, 2], "0c") &rarr; -1 //not UTF8String(0c)
 */
ASN1HEX.getIdxbyListEx = function(h, currentIndex, nthList, checkingTag) {
    var _ASN1HEX = ASN1HEX;
    var firstNth, a;
    if (nthList.length == 0) {
	if (checkingTag !== undefined) {
            if (h.substr(currentIndex, 2) !== checkingTag) {
		return -1;
            }
	}
        return currentIndex;
    }
    firstNth = nthList.shift();
    a = _ASN1HEX.getChildIdx(h, currentIndex);

    var count = 0;
    for (var i = 0; i < a.length; i++) {
	var childTag = h.substr(a[i], 2);

	if ((typeof firstNth == "number" &&
	     (! _ASN1HEX.isContextTag(childTag)) &&
	     count == firstNth) ||
	    (typeof firstNth == "string" &&
	     _ASN1HEX.isContextTag(childTag, firstNth))) {
	    return _ASN1HEX.getIdxbyListEx(h, a[i], nthList, checkingTag);
	}
	if (! _ASN1HEX.isContextTag(childTag)) count++;
    }
    return -1;
};

/**
 * get ASN.1 TLV by nthList<br/>
 * @name getTLVbyList
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 structure
 * @param {Integer} currentIndex string index to start searching in hexadecimal string "h"
 * @param {Array} nthList array of nth list index
 * @param {String} checkingTag (OPTIONAL) string of expected ASN.1 tag for nthList 
 * @return {String} referred hexadecimal string of ASN.1 TLV or null
 * @since jsrsasign 7.1.4 asn1hex 1.1.10
 *
 * @description
 * This static method is to get a ASN.1 value which specified "nthList" position
 * with checking expected tag "checkingTag".
 * <br/>
 * When referring value can't be found, this returns null.
 */
ASN1HEX.getTLVbyList = function(h, currentIndex, nthList, checkingTag) {
    var _ASN1HEX = ASN1HEX;
    var idx = _ASN1HEX.getIdxbyList(h, currentIndex, nthList, checkingTag);

    if (idx == -1) return null;
    if (idx >= h.length) return null;

    return _ASN1HEX.getTLV(h, idx);
};

/**
 * get ASN.1 TLV by nthList<br/>
 * @name getTLVbyListEx
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 structure
 * @param {Integer} currentIndex string index to start searching in hexadecimal string "h"
 * @param {Array of Object} nthList array list of nth index value or context specific tag string (ex. "[0]")
 * @param {String} checkingTag (OPTIONAL) string of expected ASN.1 tag for nthList 
 * @return {String} hexadecimal ASN.1 TLV string refered by nthList. return null if not found
 * @since jsrsasign 8.0.21 asn1hex 1.2.2
 * @see <a href="https://github.com/kjur/jsrsasign/wiki/Tutorial-for-accessing-deep-inside-of-ASN.1-structure-by-using-new-ASN1HEX.getIdxbyListEx">ASN1HEX.getIdxbyListEx tutorial wiki page</a>
 * @see {@link ASN1HEX.getIdxbyListEx}
 * @description
 * This static method is to get a ASN.1 value which specified "nthList" position
 * with checking expected tag "checkingTag".
 * This method can dig into ASN.1 object encapsulated by
 * OctetString or BitString with unused bits.
 * @example
 * 3014 seq idx=0
 *   0312 seq idx=4
 *     020101 int:1 idx=8
 *     020102 int:2 idx=14
 *     800103 [0]:3 idx=20
 *     810104 [1]:4 idx=26
 *     020105 int:5 idx=32
 *     020106 int:6 idx=38
 * h = "30140412020101020102800103810104020105020106";
 * ASN1HEX.getTLVbyList(h, 0, [0, "[0]"]) &rarr; 800103
 * ASN1HEX.getTLVbyList(h, 0, [0, 2]) &rarr; 020105
 * ASN1HEX.getTLVbyList(h, 0, [0, 2], "0c") &rarr; null //not UTF8String(0c)
 */
ASN1HEX.getTLVbyListEx = function(h, currentIndex, nthList, checkingTag) {
    var _ASN1HEX = ASN1HEX;
    var idx = _ASN1HEX.getIdxbyListEx(h, currentIndex, nthList, checkingTag);
    if (idx == -1) return null;
    return _ASN1HEX.getTLV(h, idx);
};

/**
 * get ASN.1 value by nthList<br/>
 * @name getVbyList
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 structure
 * @param {Integer} currentIndex string index to start searching in hexadecimal string "h"
 * @param {Array} nthList array of nth list index
 * @param {String} checkingTag (OPTIONAL) string of expected ASN.1 tag for nthList 
 * @param {Boolean} removeUnusedbits (OPTIONAL) flag for remove first byte for value (DEFAULT false)
 * @return {String} referred hexadecimal string of ASN.1 value(V) or null
 * @since asn1hex 1.1.4
 * @see ASN1HEX.getIdxbyList
 * @see ASN1HEX.getVbyListEx
 *
 * @description
 * This static method is to get a ASN.1 value which specified "nthList" position
 * with checking expected tag "checkingTag".
 * <br/>
 * When referring value can't be found, this returns null.
 * <br/>
 * NOTE: 'removeUnusedbits' flag has been supported since
 * jsrsasign 7.1.14 asn1hex 1.1.10.
 */
ASN1HEX.getVbyList = function(h, currentIndex, nthList, checkingTag, removeUnusedbits) {
    var _ASN1HEX = ASN1HEX;
    var idx, v;
    idx = _ASN1HEX.getIdxbyList(h, currentIndex, nthList, checkingTag);
    
    if (idx == -1) return null;
    if (idx >= h.length) return null;

    v = _ASN1HEX.getV(h, idx);
    if (removeUnusedbits === true) v = v.substr(2);
    return v;
};

/**
 * get ASN.1 V by nthList<br/>
 * @name getVbyListEx
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN.1 structure
 * @param {Integer} currentIndex string index to start searching in hexadecimal string "h"
 * @param {Array of Object} nthList array list of nth index value or context specific tag string (ex. "[0]")
 * @param {String} checkingTag (OPTIONAL) string of expected ASN.1 tag for nthList (default is undefined)
 * @param {Boolean} removeUnusedbits (OPTIONAL) flag for trim unused bit from result value (default is undefined)
 * @return {String} hexadecimal ASN.1 V string refered by nthList. return null if not found
 * @since jsrsasign 8.0.21 asn1hex 1.2.2
 * @see <a href="https://github.com/kjur/jsrsasign/wiki/Tutorial-for-accessing-deep-inside-of-ASN.1-structure-by-using-new-ASN1HEX.getIdxbyListEx">ASN1HEX.getIdxbyListEx tutorial wiki page</a>
 * @see {@link ASN1HEX.getIdxbyListEx}
 *
 * @description
 * This static method is to get a ASN.1 value which specified "nthList" position
 * with checking expected tag "checkingTag".
 * This method can dig into ASN.1 object encapsulated by
 * OctetString or BitString with unused bits.
 *
 * @example
 * 3014 seq idx=0
 *   3012 seq idx=4
 *     020101 int:1 idx=8
 *     020102 int:2 idx=14
 *     800103 [0]:3 idx=20
 *     810104 [1]:4 idx=26
 *     020105 int:5 idx=32
 *     020106 int:6 idx=38
 * h = "30140412020101020102800103810104020105020106";
 * ASN1HEX.getTLVbyList(h, 0, [0, "[0]"]) &rarr; 03
 * ASN1HEX.getTLVbyList(h, 0, [0, 2]) &rarr; 05
 * ASN1HEX.getTLVbyList(h, 0, [0, 2], "0c") &rarr; null //not UTF8String(0c)
 */
ASN1HEX.getVbyListEx = function(h, currentIndex, nthList, checkingTag, removeUnusedbits) {
    var _ASN1HEX = ASN1HEX;
    var idx, tlv, v;
    idx = _ASN1HEX.getIdxbyListEx(h, currentIndex, nthList, checkingTag);
    if (idx == -1) return null;
    v = _ASN1HEX.getV(h, idx);
    if (h.substr(idx, 2) == "03" && removeUnusedbits !== false) v = v.substr(2);
    return v;
};

/**
 * get integer value from ASN.1 V(value) of Integer or BitString<br/>
 * @name getInt
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string
 * @param {Number} idx string index in h to get ASN.1 DER Integer or BitString
 * @param {Object} errorReturn (OPTION) error return value (DEFAULT: -1)
 * @return {Number} ASN.1 DER Integer or BitString value
 * @since jsrsasign 10.1.0 asn1hex 1.2.7
 * @see bitstrtoint
 *
 * @example
 * ASN1HEX.getInt("xxxx020103xxxxxx", 4) &rarr 3 // DER Integer
 * ASN1HEX.getInt("xxxx03020780xxxxxx", 4) &rarr 1 // DER BitStringx
 * ASN1HEX.getInt("xxxx030203c8xxxxxx", 4) &rarr 25 // DER BitStringx
 */
ASN1HEX.getInt = function(h, idx, errorReturn) {
    if (errorReturn == undefined) errorReturn = -1;
    try {
	var hTag = h.substr(idx, 2);
	if (hTag != "02" && hTag != "03") return errorReturn;
	var hV = ASN1HEX.getV(h, idx);
	if (hTag == "02") {
	    return parseInt(hV, 16);
	} else {
	    return bitstrtoint(hV);
	}
    } catch(ex) {
	return errorReturn;
    }
};

/**
 * get object identifier string from ASN.1 V(value)<br/>
 * @name getOID
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string
 * @param {Number} idx string index in h to get ASN.1 DER ObjectIdentifier
 * @param {Object} errorReturn (OPTION) error return value (DEFAULT: null)
 * @return {String} object identifier string (ex. "1.2.3.4")
 * @since jsrsasign 10.1.0 asn1hex 1.2.7
 *
 * @example
 * ASN1HEX.getInt("xxxx06032a0304xxxxxx", 4) &rarr "1.2.3.4"
 */
ASN1HEX.getOID = function(h, idx, errorReturn) {
    if (errorReturn == undefined) errorReturn = null;
    try {
	if (h.substr(idx, 2) != "06") return errorReturn;
	var hOID = ASN1HEX.getV(h, idx);
	return hextooid(hOID);
    } catch(ex) {
	return errorReturn;
    }
};

/**
 * get object identifier name from ASN.1 V(value)<br/>
 * @name getOIDName
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string
 * @param {Number} idx string index in h to get ASN.1 DER ObjectIdentifier
 * @param {Object} errorReturn (OPTION) error return value (DEFAULT: null)
 * @return {String} object identifier name (ex. "sha256") oir OID string
 * @since jsrsasign 10.1.0 asn1hex 1.2.7
 *
 * @description
 * This static method returns object identifier name such as "sha256"
 * if registered. If not registered, it returns OID string. 
 * (ex. "1.2.3.4")
 *
 * @example
 * ASN1HEX.getOIDName("xxxx0609608648016503040201xxxxxx", 4) &rarr "sha256"
 * ASN1HEX.getOIDName("xxxx06032a0304xxxxxx", 4) &rarr "1.2.3.4"
 */
ASN1HEX.getOIDName = function(h, idx, errorReturn) {
    if (errorReturn == undefined) errorReturn = null;
    try {
	var oid = ASN1HEX.getOID(h, idx, errorReturn);
	if (oid == errorReturn) return errorReturn;
	var name = KJUR.asn1.x509.OID.oid2name(oid);
	if (name == '') return oid;
	return name;
    } catch(ex) {
	return errorReturn;
    }
};

/**
 * get raw string from ASN.1 V(value)<br/>
 * @name getString
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string
 * @param {Number} idx string index in h to get any ASN.1 DER String
 * @param {Object} errorReturn (OPTION) error return value (DEFAULT: null)
 * @return {String} raw string
 * @since jsrsasign 10.1.3 asn1hex 1.2.8
 *
 * @description
 * This static method returns a raw string from
 * any ASN.1 DER primitives.
 *
 * @example
 * ASN1HEX.getString("xxxx1303616161xxxxxx", 4) &rarr "aaa"
 * ASN1HEX.getString("xxxx0c03616161xxxxxx", 4) &rarr "aaa"
 */
ASN1HEX.getString = function(h, idx, errorReturn) {
    if (errorReturn == undefined) errorReturn = null;
    try {
	var hV = ASN1HEX.getV(h, idx);
	return hextorstr(hV);
    } catch(ex) {
	return errorReturn;
    }
};

/**
 * get OID string from hexadecimal encoded value<br/>
 * @name hextooidstr
 * @memberOf ASN1HEX
 * @function
 * @param {String} hex hexadecmal string of ASN.1 DER encoded OID value
 * @return {String} OID string (ex. '1.2.3.4.567')
 * @since asn1hex 1.1.5
 * @see {@link KJUR.asn1.ASN1Util.oidIntToHex}
 * @description
 * This static method converts from ASN.1 DER encoded 
 * hexadecimal object identifier value to dot concatinated OID value.
 * {@link KJUR.asn1.ASN1Util.oidIntToHex} is a reverse function of this.
 * @example
 * ASN1HEX.hextooidstr("550406") &rarr; "2.5.4.6"
 */
ASN1HEX.hextooidstr = function(hex) {
    var zeroPadding = function(s, len) {
        if (s.length >= len) return s;
        return new Array(len - s.length + 1).join('0') + s;
    };

    var a = [];

    // a[0], a[1]
    var hex0 = hex.substr(0, 2);
    var i0 = parseInt(hex0, 16);
    a[0] = new String(Math.floor(i0 / 40));
    a[1] = new String(i0 % 40);

    // a[2]..a[n]
   var hex1 = hex.substr(2);
    var b = [];
    for (var i = 0; i < hex1.length / 2; i++) {
    b.push(parseInt(hex1.substr(i * 2, 2), 16));
    }
    var c = [];
    var cbin = "";
    for (var i = 0; i < b.length; i++) {
        if (b[i] & 0x80) {
            cbin = cbin + zeroPadding((b[i] & 0x7f).toString(2), 7);
        } else {
            cbin = cbin + zeroPadding((b[i] & 0x7f).toString(2), 7);
            c.push(new String(parseInt(cbin, 2)));
            cbin = "";
        }
    }

    var s = a.join(".");
    if (c.length > 0) s = s + "." + c.join(".");
    return s;
};

/**
 * get string of simple ASN.1 dump from hexadecimal ASN.1 data<br/>
 * @name dump
 * @memberOf ASN1HEX
 * @function
 * @param {Object} hexOrObj hexadecmal string of ASN.1 data or ASN1Object object
 * @param {Array} flags associative array of flags for dump (OPTION)
 * @param {Number} idx string index for starting dump (OPTION)
 * @param {String} indent indent string (OPTION)
 * @return {String} string of simple ASN.1 dump
 * @since jsrsasign 4.8.3 asn1hex 1.1.6
 * @description
 * This method will get an ASN.1 dump from
 * hexadecmal string of ASN.1 DER encoded data.
 * Here are features:
 * <ul>
 * <li>ommit long hexadecimal string</li>
 * <li>dump encapsulated OCTET STRING (good for X.509v3 extensions)</li>
 * <li>structured/primitive context specific tag support (i.e. [0], [3] ...)</li>
 * <li>automatic decode for implicit primitive context specific tag 
 * (good for X.509v3 extension value)
 *   <ul>
 *   <li>if hex starts '68747470'(i.e. http) it is decoded as utf8 encoded string.</li>
 *   <li>if it is in 'subjectAltName' extension value and is '[2]'(dNSName) tag
 *   value will be encoded as utf8 string</li>
 *   <li>otherwise it shows as hexadecimal string</li>
 *   </ul>
 * </li>
 * </ul>
 * NOTE1: Argument {@link KJUR.asn1.ASN1Object} object is supported since
 * jsrsasign 6.2.4 asn1hex 1.0.8
 * @example
 * // 1) ASN.1 INTEGER
 * ASN1HEX.dump('0203012345')
 * &darr;
 * INTEGER 012345
 *
 * // 2) ASN.1 Object Identifier
 * ASN1HEX.dump('06052b0e03021a')
 * &darr;
 * ObjectIdentifier sha1 (1 3 14 3 2 26)
 *
 * // 3) ASN.1 SEQUENCE
 * ASN1HEX.dump('3006020101020102')
 * &darr;
 * SEQUENCE
 *   INTEGER 01
 *   INTEGER 02
 *
 * // 4) ASN.1 SEQUENCE since jsrsasign 6.2.4
 * o = KJUR.asn1.ASN1Util.newObject({seq: [{int: 1}, {int: 2}]});
 * ASN1HEX.dump(o)
 * &darr;
 * SEQUENCE
 *   INTEGER 01
 *   INTEGER 02
 * // 5) ASN.1 DUMP FOR X.509 CERTIFICATE
 * ASN1HEX.dump(pemtohex(certPEM))
 * &darr;
 * SEQUENCE
 *   SEQUENCE
 *     [0]
 *       INTEGER 02
 *     INTEGER 0c009310d206dbe337553580118ddc87
 *     SEQUENCE
 *       ObjectIdentifier SHA256withRSA (1 2 840 113549 1 1 11)
 *       NULL
 *     SEQUENCE
 *       SET
 *         SEQUENCE
 *           ObjectIdentifier countryName (2 5 4 6)
 *           PrintableString 'US'
 *             :
 */
ASN1HEX.dump = function(hexOrObj, flags, idx, indent) {
    var _ASN1HEX = ASN1HEX;
    var _getV = _ASN1HEX.getV;
    var _dump = _ASN1HEX.dump;
    var _getChildIdx = _ASN1HEX.getChildIdx;

    var hex = hexOrObj;
    if (hexOrObj instanceof KJUR.asn1.ASN1Object)
	hex = hexOrObj.getEncodedHex();

    var _skipLongHex = function(hex, limitNumOctet) {
	if (hex.length <= limitNumOctet * 2) {
	    return hex;
	} else {
	    var s = hex.substr(0, limitNumOctet) + 
		    "..(total " + hex.length / 2 + "bytes).." +
		    hex.substr(hex.length - limitNumOctet, limitNumOctet);
	    return s;
	};
    };

    if (flags === undefined) flags = { "ommit_long_octet": 32 };
    if (idx === undefined) idx = 0;
    if (indent === undefined) indent = "";
    var skipLongHex = flags.ommit_long_octet;

    var tag = hex.substr(idx, 2);

    if (tag == "01") {
	var v = _getV(hex, idx);
	if (v == "00") {
	    return indent + "BOOLEAN FALSE\n";
	} else {
	    return indent + "BOOLEAN TRUE\n";
	}
    }
    if (tag == "02") {
	var v = _getV(hex, idx);
        return indent + "INTEGER " + _skipLongHex(v, skipLongHex) + "\n";
    }
    if (tag == "03") {
	var v = _getV(hex, idx);
	if (_ASN1HEX.isASN1HEX(v.substr(2))) {
  	    var s = indent + "BITSTRING, encapsulates\n";
            s = s + _dump(v.substr(2), flags, 0, indent + "  ");
            return s;
	} else {
            return indent + "BITSTRING " + _skipLongHex(v, skipLongHex) + "\n";
	}
    }
    if (tag == "04") {
	var v = _getV(hex, idx);
	if (_ASN1HEX.isASN1HEX(v)) {
	    var s = indent + "OCTETSTRING, encapsulates\n";
	    s = s + _dump(v, flags, 0, indent + "  ");
	    return s;
	} else {
	    return indent + "OCTETSTRING " + _skipLongHex(v, skipLongHex) + "\n";
	}
    }
    if (tag == "05") {
	return indent + "NULL\n";
    }
    if (tag == "06") {
	var hV = _getV(hex, idx);
        var oidDot = KJUR.asn1.ASN1Util.oidHexToInt(hV);
        var oidName = KJUR.asn1.x509.OID.oid2name(oidDot);
	var oidSpc = oidDot.replace(/\./g, ' ');
        if (oidName != '') {
  	    return indent + "ObjectIdentifier " + oidName + " (" + oidSpc + ")\n";
	} else {
  	    return indent + "ObjectIdentifier (" + oidSpc + ")\n";
	}
    }
    if (tag == "0a") {
	return indent + "ENUMERATED " + parseInt(_getV(hex, idx)) + "\n";
    }
    if (tag == "0c") {
	return indent + "UTF8String '" + hextoutf8(_getV(hex, idx)) + "'\n";
    }
    if (tag == "13") {
	return indent + "PrintableString '" + hextoutf8(_getV(hex, idx)) + "'\n";
    }
    if (tag == "14") {
	return indent + "TeletexString '" + hextoutf8(_getV(hex, idx)) + "'\n";
    }
    if (tag == "16") {
	return indent + "IA5String '" + hextoutf8(_getV(hex, idx)) + "'\n";
    }
    if (tag == "17") {
	return indent + "UTCTime " + hextoutf8(_getV(hex, idx)) + "\n";
    }
    if (tag == "18") {
	return indent + "GeneralizedTime " + hextoutf8(_getV(hex, idx)) + "\n";
    }
    if (tag == "1a") {
	return indent + "VisualString '" + hextoutf8(_getV(hex, idx)) + "'\n";
    }
    if (tag == "1e") {
	return indent + "BMPString '" + ucs2hextoutf8(_getV(hex, idx)) + "'\n";
    }
    if (tag == "30") {
	if (hex.substr(idx, 4) == "3000") {
	    return indent + "SEQUENCE {}\n";
	}

	var s = indent + "SEQUENCE\n";
	var aIdx = _getChildIdx(hex, idx);

	var flagsTemp = flags;
	
	if ((aIdx.length == 2 || aIdx.length == 3) &&
	    hex.substr(aIdx[0], 2) == "06" &&
	    hex.substr(aIdx[aIdx.length - 1], 2) == "04") { // supposed X.509v3 extension
	    var oidName = _ASN1HEX.oidname(_getV(hex, aIdx[0]));
	    var flagsClone = JSON.parse(JSON.stringify(flags));
	    flagsClone.x509ExtName = oidName;
	    flagsTemp = flagsClone;
	}
	
	for (var i = 0; i < aIdx.length; i++) {
	    s = s + _dump(hex, flagsTemp, aIdx[i], indent + "  ");
	}
	return s;
    }
    if (tag == "31") {
	var s = indent + "SET\n";
	var aIdx = _getChildIdx(hex, idx);
	for (var i = 0; i < aIdx.length; i++) {
	    s = s + _dump(hex, flags, aIdx[i], indent + "  ");
	}
	return s;
    }
    var tag = parseInt(tag, 16);
    if ((tag & 128) != 0) { // context specific 
	var tagNumber = tag & 31;
	if ((tag & 32) != 0) { // structured tag
	    var s = indent + "[" + tagNumber + "]\n";
	    var aIdx = _getChildIdx(hex, idx);
	    for (var i = 0; i < aIdx.length; i++) {
		s = s + _dump(hex, flags, aIdx[i], indent + "  ");
	    }
	    return s;
	} else { // primitive tag
	    var v = _getV(hex, idx);
	    if (ASN1HEX.isASN1HEX(v)) {
		var s = indent + "[" + tagNumber + "]\n";
		s = s + _dump(v, flags, 0, indent + "  ");
		return s;
	    } else if (v.substr(0, 8) == "68747470") { // http
		v = hextoutf8(v);
	    } else if (flags.x509ExtName === "subjectAltName" &&
		       tagNumber == 2) {
		v = hextoutf8(v);
	    }
	    // else if (ASN1HEX.isASN1HEX(v))

	    var s = indent + "[" + tagNumber + "] " + v + "\n";
	    return s;
	}
    }
    return indent + "UNKNOWN(" + tag + ") " + 
	   _getV(hex, idx) + "\n";
};

/**
 * parse ASN.1 DER hexadecimal string<br/>
 * @name parse
 * @memberOf ASN1HEX
 * @function
 * @param {String} h hexadecimal string of ASN1. DER
 * @return {Object} associative array of ASN.1 parsed result
 * @since jsrsasign 10.5.3 asn1hex 1.1.x
 * @see KJUR.asn1.ASN1Util.newOjbect
 *
 * @description
 * This method parses ASN.1 DER hexadecimal string.
 * Its result can be applied to {@link KJUR.asn1.ASN1Util.newOjbect}.
 *
 * @example
 * ASN1HEX.parse("31193017...") &rarr; // RDN
 * {set: [{seq: [{oid: "localityName"}, {utf8str: {str: "Test"}}] }]}
 */
ASN1HEX.parse = function(h) {
    var _ASN1HEX = ASN1HEX,
	_parse = _ASN1HEX.parse,
	_isASN1HEX = _ASN1HEX.isASN1HEX,
	_getV = _ASN1HEX.getV,
	_getTLV = _ASN1HEX.getTLV,
	_getChildIdx = _ASN1HEX.getChildIdx,
	_KJUR_asn1 = KJUR.asn1,
	_oidHexToInt = _KJUR_asn1.ASN1Util.oidHexToInt,
	_oid2name = _KJUR_asn1.x509.OID.oid2name,
	_hextoutf8 = hextoutf8,
	_ucs2hextoutf8 = ucs2hextoutf8,
	_iso88591hextoutf8 = iso88591hextoutf8;

    var tagName = {
	"0c": "utf8str", "12": "numstr", "13": "prnstr", 
	"14": "telstr", "16": "ia5str", "17": "utctime", 
	"18": "gentime", "1a": "visstr", "1e": "bmpstr", 
	"30": "seq", "31": "set"
    };

    var _parseChild = function(h) {
	var result = [];
	var aIdx = _getChildIdx(h, 0);
	for (var i = 0; i < aIdx.length; i++) {
	    var idx = aIdx[i];
	    var hTLV = _getTLV(h, idx);
	    var pItem = _parse(hTLV);
	    result.push(pItem);
	}
	return result;
    };

    var tag = h.substr(0, 2);
    var result = {};
    var hV = _getV(h, 0);
    if (tag == "01") {
	if (h == "0101ff") return {bool: true};
	return {bool: false};
    } else if (tag == "02") {
	return {"int": {hex: hV}};
    } else if (tag == "03") {
	try {
	    if (hV.substr(0, 2) != "00") throw "not encap";
	    var hV1 = hV.substr(2);
	    if (! _isASN1HEX(hV1)) throw "not encap";
	    return {bitstr: {obj: _parse(hV1)}};
	} catch(ex) {
	    var bV = null;
	    if (hV.length <= 6) bV = bitstrtobinstr(hV);
	    if (bV == null) {
		return {bitstr: {hex: hV}};
	    } else {
		return {bitstr: {bin: bV}};
	    }
	}
    } else if (tag == "04") {
	try {
	    if (! _isASN1HEX(hV)) throw "not encap";
	    return {octstr: {obj: _parse(hV)}};
	} catch(ex) {
	    return {octstr: {hex: hV}};
	}
    } else if (tag == "05") {
	return {"null": ''};
    } else if (tag == "06") {
	var oidDot = _oidHexToInt(hV);
	var oidName = _oid2name(oidDot);
	if (oidName == "") {
	    return {oid: oidDot};
	} else {
	    return {oid: oidName};
	}
    } else if (tag == "0a") {
	if (hV.length > 4) {
	    return {"enum": {hex: hV}};
	} else {
	    return {"enum": parseInt(hV, 16)};
	}
    } else if (tag == "30" || tag == "31") {
	result[tagName[tag]] = _parseChild(h);
	return result;
    } else if (tag == "14") { // TeletexString
	var s = _iso88591hextoutf8(hV);
	result[tagName[tag]] = {str: s};
	return result;
    } else if (tag == "1e") { // BMPString
	var s = _ucs2hextoutf8(hV);
	result[tagName[tag]] = {str: s};
	return result;
    } else if (":0c:12:13:16:17:18:1a:".indexOf(tag) != -1) { // Other Strings types
	var s = _hextoutf8(hV);
	result[tagName[tag]] = {str: s};
	return result;
    } else if (tag.match(/^8[0-9]$/)) {
	var s = _hextoutf8(hV);
	if (s == null | s == "") {
	    return {"tag": {"tag": tag, explicit: false, hex: hV}};
	} else if (s.match(/[\x00-\x1F\x7F-\x9F]/) != null ||
		   s.match(/[\u0000-\u001F\u0080–\u009F]/) != null) {
	    return {"tag": {"tag": tag, explicit: false, hex: hV}};
	} else {
	    return {"tag": {"tag": tag, explicit: false, str: s}};
	}
    } else if (tag.match(/^a[0-9]$/)) {
	try {
	    if (! _isASN1HEX(hV)) throw new Error("not encap");
	    return {"tag": {"tag": tag, 
			    explicit: true,
			    obj: _parse(hV)}};
	} catch(ex) {
	    return {"tag": {"tag": tag, explicit: true, hex: hV}};
	}
    } else {
	var d = new KJUR.asn1.ASN1Object();
	d.hV = hV;
	var hL = d.getLengthHexFromValue();
	return {"asn1": {"tlv": tag + hL + hV}};
    }
};

/**
 * check if a hexadecimal tag is a specified ASN.1 context specific tag
 * @name isContextTag
 * @memberOf ASN1HEX
 * @function
 * @param {hTag} hex string of a hexadecimal ASN.1 tag consists by two characters (e.x. "a0")
 * @param {sTag} context specific tag in string represention (OPTION) (e.x. "[0]")
 * @return {Boolean} true if hTag is a ASN.1 context specific tag specified by sTag value.
 * @since jsrsasign 8.0.21 asn1hex 1.2.2
 * @description
 * This method checks if a hexadecimal tag is a specified ASN.1 context specific tag.
 * Structured and non-structured type of tag have the same string representation
 * of context specific tag. For example tag "a0" and "80" have the same string
 * representation "[0]".
 * The sTag has a range from from "[0]" to "[31]".
 * @example
 * ASN1HEX.isContextTag('a0', '[0]') &rarr; true // structured
 * ASN1HEX.isContextTag('a1', '[1]') &rarr; true // structured
 * ASN1HEX.isContextTag('a2', '[2]') &rarr; true // structured
 * ASN1HEX.isContextTag('80', '[0]') &rarr; true // non structured
 * ASN1HEX.isContextTag('81', '[1]') &rarr; true // non structured
 * ASN1HEX.isContextTag('82', '[2]') &rarr; true // non structured
 * ASN1HEX.isContextTag('a0', '[3]') &rarr; false
 * ASN1HEX.isContextTag('80', '[15]') &rarr; false
 *
 * ASN.1 tag bits
 * 12345679
 * ++        tag class(universal:00, context specific:10)
 *   +       structured:1, primitive:0
 *    +++++  tag number (0 - 31)
 */
ASN1HEX.isContextTag = function(hTag, sTag) {
    hTag = hTag.toLowerCase();
    var ihtag, istag;

    try {
	ihtag = parseInt(hTag, 16);
    } catch (ex) {
	return -1;
    }
	
    if (sTag === undefined) {
	if ((ihtag & 192) == 128) {
	    return true;
	} else {
	    return false;
	}
    }

    try {
	var result = sTag.match(/^\[[0-9]+\]$/);
	if (result == null) return false;
	istag = parseInt(sTag.substr(1,sTag.length - 1), 10);
	if (istag > 31) return false;
	if (((ihtag & 192) == 128) &&   // ihtag & b11000000 == b10000000
	    ((ihtag & 31) == istag)) {  // ihtag & b00011111 == istag (0-31)
	    return true;
	}
	return false;
    } catch (ex) {
	return false;
    }
};

/**
 * simple ASN.1 DER hexadecimal string checker<br/>
 * @name isASN1HEX
 * @memberOf ASN1HEX
 * @function
 * @param {String} hex string to check whether it is hexadecmal string for ASN.1 DER or not
 * @return {Boolean} true if it is hexadecimal string of ASN.1 data otherwise false
 * @since jsrsasign 4.8.3 asn1hex 1.1.6
 * @description
 * This method checks wheather the argument 'hex' is a hexadecimal string of
 * ASN.1 data or not.
 * @example
 * ASN1HEX.isASN1HEX('0203012345') &rarr; true // PROPER ASN.1 INTEGER
 * ASN1HEX.isASN1HEX('0203012345ff') &rarr; false // TOO LONG VALUE
 * ASN1HEX.isASN1HEX('02030123') &rarr; false // TOO SHORT VALUE
 * ASN1HEX.isASN1HEX('fa3bcd') &rarr; false // WRONG FOR ASN.1
 */
ASN1HEX.isASN1HEX = function(hex) {
    var _ASN1HEX = ASN1HEX;
    if (hex.length % 2 == 1) return false;

    var intL = _ASN1HEX.getVblen(hex, 0);
    var hT = hex.substr(0, 2);
    var hL = _ASN1HEX.getL(hex, 0);
    var hVLength = hex.length - hT.length - hL.length;
    if (hVLength == intL * 2) return true;

    return false;
};

/**
 * strict ASN.1 DER hexadecimal string checker
 * @name checkStrictDER
 * @memberOf ASN1HEX
 * @function
 * @param {String} hex string to check whether it is hexadecmal string for ASN.1 DER or not
 * @return unspecified
 * @since jsrsasign 8.0.19 asn1hex 1.2.1
 * @throws Error when malformed ASN.1 DER hexadecimal string
 * @description
 * This method checks wheather the argument 'hex' is a hexadecimal string of
 * ASN.1 data or not. If the argument is not DER string, this 
 * raise an exception.
 * @example
 * ASN1HEX.checkStrictDER('0203012345') &rarr; NO EXCEPTION FOR PROPER ASN.1 INTEGER
 * ASN1HEX.checkStrictDER('0203012345ff') &rarr; RAISE EXCEPTION FOR TOO LONG VALUE
 * ASN1HEX.checkStrictDER('02030123') &rarr; false RAISE EXCEPITON FOR TOO SHORT VALUE
 * ASN1HEX.checkStrictDER('fa3bcd') &rarr; false RAISE EXCEPTION FOR WRONG ASN.1
 */
ASN1HEX.checkStrictDER = function(h, idx, maxHexLen, maxByteLen, maxLbyteLen) {
    var _ASN1HEX = ASN1HEX;

    if (maxHexLen === undefined) {
	// 1. hex string check
	if (typeof h != "string") throw new Error("not hex string");
	h = h.toLowerCase();
	if (! KJUR.lang.String.isHex(h)) throw new Error("not hex string");

	// 2. set max if needed
	// max length of hexadecimal string
	maxHexLen = h.length;
	// max length of octets
	maxByteLen = h.length / 2;
	// max length of L octets of TLV
	if (maxByteLen < 0x80) {
	    maxLbyteLen = 1;
	} else {
	    maxLbyteLen = Math.ceil(maxByteLen.toString(16)) + 1;
	}
    }
    //console.log(maxHexLen + ":" + maxByteLen + ":" + maxLbyteLen);

    // 3. check if L(length) string not exceeds maxLbyteLen
    var hL = _ASN1HEX.getL(h, idx);
    if (hL.length > maxLbyteLen * 2)
	throw new Error("L of TLV too long: idx=" + idx);

    // 4. check if V(value) octet length (i.e. L(length) value) 
    //    not exceeds maxByteLen
    var vblen = _ASN1HEX.getVblen(h, idx);
    if (vblen > maxByteLen) 
	throw new Error("value of L too long than hex: idx=" + idx);

    // 5. check V string length and L's value are the same
    var hTLV = _ASN1HEX.getTLV(h, idx);
    var hVLength = 
	hTLV.length - 2 - _ASN1HEX.getL(h, idx).length;
    if (hVLength !== (vblen * 2))
	throw new Error("V string length and L's value not the same:" +
		        hVLength + "/" + (vblen * 2));

    // 6. check appending garbled string
    if (idx === 0) {
	if (h.length != hTLV.length)
	    throw new Error("total length and TLV length unmatch:" +
			    h.length + "!=" + hTLV.length);
    }

    // 7. check if there isn't prepending zeros in DER INTEGER value
    var hT = h.substr(idx, 2);
    if (hT === '02') {
	var vidx = _ASN1HEX.getVidx(h, idx);
	// check if DER INTEGER VALUE have least leading zeros 
	// for two's complement
	// GOOD - 3fabde... 008fad...
	// BAD  - 000012... 007fad...
	if (h.substr(vidx, 2) == "00" && h.charCodeAt(vidx + 2) < 56) // '8'=56
	    throw new Error("not least zeros for DER INTEGER");
    }

    // 8. check if all of elements in a structured item are conformed to
    //    strict DER encoding rules.
    if (parseInt(hT, 16) & 32) { // structured tag?
	var intL = _ASN1HEX.getVblen(h, idx);
	var sum = 0;
	var aIdx = _ASN1HEX.getChildIdx(h, idx);
	for (var i = 0; i < aIdx.length; i++) {
	    var tlv = _ASN1HEX.getTLV(h, aIdx[i]);
	    sum += tlv.length;
	    _ASN1HEX.checkStrictDER(h, aIdx[i], 
				   maxHexLen, maxByteLen, maxLbyteLen);
	}
	if ((intL * 2) != sum)
	    throw new Error("sum of children's TLV length and L unmatch: " +
			    (intL * 2) + "!=" + sum);
    }
};

/**
 * get hexacedimal string from PEM format data<br/>
 * @name oidname
 * @memberOf ASN1HEX
 * @function
 * @param {String} oidDotOrHex number dot notation(i.e. 1.2.3) or hexadecimal string for OID
 * @return {String} name for OID
 * @since jsrsasign 7.2.0 asn1hex 1.1.11
 * @description
 * This static method gets a OID name for
 * a specified string of number dot notation (i.e. 1.2.3) or
 * hexadecimal string.
 * @example
 * ASN1HEX.oidname("2.5.29.37") &rarr; extKeyUsage
 * ASN1HEX.oidname("551d25") &rarr; extKeyUsage
 * ASN1HEX.oidname("0.1.2.3") &rarr; 0.1.2.3 // unknown
 */
ASN1HEX.oidname = function(oidDotOrHex) {
    var _KJUR_asn1 = KJUR.asn1;
    if (KJUR.lang.String.isHex(oidDotOrHex))
	oidDotOrHex = _KJUR_asn1.ASN1Util.oidHexToInt(oidDotOrHex);
    var name = _KJUR_asn1.x509.OID.oid2name(oidDotOrHex);
    if (name === "") name = oidDotOrHex;
    return name;
};

