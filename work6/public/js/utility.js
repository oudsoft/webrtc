//utility.js
const delay = t => new Promise(resolve => setTimeout(resolve, t));
/*
	usage
	delay(3000).then(() => console.log('Hello'));
*/

/*
	การ cast ตัวเลขเป็น boolean
	เดิมใช้วิธีนี้
	a = a !== 0;
	ย่อเหลือเพียง
	a = !!a;
*/

/*
	กรองคำหยาบ
*/

const wordrude = new Array ( "ashole","a s h o l e","a.s.h.o.l.e","bitch","b i t c h","b.i.t.c.h","shit","s h i t","s.h.i.t","fuck","dick","f u c k","d i c k","f.u.c.k","d.i.c.k","มึง","มึ ง","ม ึ ง","ม ึง","มงึ","มึ.ง","มึ_ง","มึ-ง","มึ+ง","กู","ควย","ค ว ย","ค.ว.ย","คอ วอ ยอ","คอ-วอ-ยอ","ปี้","เหี้ย","ไอ้เหี้ย","เฮี้ย","ชาติหมา","ชาดหมา","ช า ด ห ม า","ช.า.ด.ห.ม.า","ช า ติ ห ม า","ช.า.ติ.ห.ม.า","สัดหมา","สัด","เย็ด","หี","สันดาน","แม่ง","ระยำ","ส้น ตีน","แตด", "ชิงหมาเกิด", "ไอ้เปรต", "อีเปรต" );

function ckeckrude( data ){
	//block คำหยาบ และประโยคที่จะนำมาแทนที่
	const rudemarkOpenTag = '<span style="color:red">';
	const rudemarkCloseTag = '</span>';

	for ( n = 0 ; n < wordrude.length ; n++ ){
		let rude = wordrude[n];
		let pattern = new RegExp( rude , "gi" );
		data = data.replace( pattern , (rudemarkOpenTag + rude + rudemarkCloseTag) );
	};
	return data;
};

function doCheckRude(data){
	var isRude = false;
	for ( n = 0 ; n < wordrude.length ; n++ ){
		var patt = new RegExp(wordrude[n]);
		var isRude = patt.test(data);
		if (isRude) {
			break;
			return isRude;
		}
	}
	return isRude;	
}

/*
	zero fill
*/
function zeroFill( number, width ){
  width -= number.toString().length;
  if ( width > 0 ){
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}

function padZero(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

/* Messaging Management Share Section */

function handleMessage(message){
	console.log('Message From Client: ' + JSON.stringify(message));
	var frameMessage = document.createElement('div');
	frameMessage.className = 'FrameMessage';
	var newMessage = document.createElement('div');
	newMessage.textContent = message.msg;	
	if (message.fromId === clientNo){
		newMessage.className = 'SelfMessage';
		frameMessage.appendChild(newMessage);
	} else {
		newMessage.className = 'OtherMessage';
		var senderMessage = document.createElement('p');
		var timeStamp = new Date(message.timestamp);
		senderMessage.textContent = `จาก  ${message.fromId} เมื่อ ${timeStamp.getHours()}:${timeStamp.getMinutes()}`;	
		senderMessage.className = 'SenderMessage';
		frameMessage.appendChild(newMessage);
		frameMessage.appendChild(senderMessage);
	}
	msgScreen.appendChild(frameMessage);
	msgScreen.scrollIntoView();
	scrollToBottom(msgScreen);
}

function handleRegister(data) {
	console.log('Register Data: ' + JSON.stringify(data));
	const userProfile = document.createElement('h2');
	userProfile.textContent = data.clientNo;
	clientProfile.style.display = "block";	
	clientProfile.appendChild(userProfile);
	clientId = data.clientId;
	clientNo = data.clientNo;
}

function scrollToBottom(e) {
  e.scrollTop = e.scrollHeight - e.getBoundingClientRect().height;
}