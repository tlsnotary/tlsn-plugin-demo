use k256::pkcs8::DecodePublicKey;
use k256::pkcs8::EncodePublicKey;
use neon::prelude::*;
use tlsn_core::{
    presentation::{Presentation, PresentationOutput},
    signing::VerifyingKey,
    CryptoProvider,
};

fn verify(mut cx: FunctionContext) -> JsResult<JsObject> {
    let presentation_cx = cx.argument::<JsString>(0)?.value(&mut cx);
    let notary_key_cx = cx.argument::<JsString>(1)?.value(&mut cx);

    let (sent, recv, time) =
        verify_presentation(presentation_cx, notary_key_cx).or_else(|e| cx.throw_error(e))?;

    let obj: Handle<JsObject> = cx.empty_object();
    let sent_str = cx.string(sent);
    obj.set(&mut cx, "sent", sent_str)?;
    let recv_str = cx.string(recv);
    obj.set(&mut cx, "recv", recv_str)?;
    let session_time = cx.number(time as f64);
    obj.set(&mut cx, "time", session_time)?;

    Ok(obj)
}

fn verify_presentation(
    presentation_cx: String,
    notary_key_cx: String,
) -> Result<(String, String, u64), String> {
    let bytes: Vec<u8> = hex::decode(presentation_cx.as_str()).map_err(|e| e.to_string())?;
    let presentation: Presentation = bincode::deserialize(&bytes).map_err(|e| e.to_string())?;

    let VerifyingKey {
        alg: _,
        data: key_data,
    } = presentation.verifying_key();

    let notary_key = k256::PublicKey::from_public_key_pem(notary_key_cx.as_str())
        .map_err(|x| format!("Invalid notary key: {}", x))?;
    let verifying_key = k256::PublicKey::from_sec1_bytes(key_data)
        .map_err(|x| format!("Invalid verifying key: {}", x))?;

    if notary_key != verifying_key {
        Err("The verifying key does not match the notary key")?;
    }

    let provider = CryptoProvider::default();
    let PresentationOutput {
        connection_info,
        transcript,
        ..
    } = presentation
        .verify(&provider)
        .map_err(|x| format!("Presentation verification failed: {}", x))?;

    let (sent, recv) = transcript
        .map(|mut partial_transcript| {
            partial_transcript.set_unauthed(b'X');
            let sent = String::from_utf8_lossy(partial_transcript.sent_unsafe()).to_string();
            let recv = String::from_utf8_lossy(partial_transcript.received_unsafe()).to_string();
            (sent, recv)
        })
        .unwrap_or_default();

    Ok((sent, recv, connection_info.time))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("verify", verify)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    #[derive(Deserialize, Debug)]
    struct Presentation {
        version: String,
        data: String,
    }

    fn example_presentation() -> String {
        let example = include_str!("example.json");
        let presentation: Presentation = serde_json::from_str(&example).unwrap();
        assert_eq!("0.1.0-alpha.12", presentation.version);
        presentation.data
    }

    fn extract_verifying_key_as_pem(presentation_data: String) -> Result<String, String> {
        let bytes: Vec<u8> = hex::decode(presentation_data.as_str()).map_err(|e| e.to_string())?;
        let presentation: tlsn_core::presentation::Presentation = bincode::deserialize(&bytes).map_err(|e| e.to_string())?;

        let VerifyingKey {
            alg: _,
            data: key_data,
        } = presentation.verifying_key();

        let verifying_key = k256::PublicKey::from_sec1_bytes(&key_data)
            .map_err(|x| format!("Invalid verifying key: {}", x))?;

        let pem = verifying_key.to_public_key_pem(k256::pkcs8::LineEnding::LF)
            .map_err(|x| format!("Failed to convert to PEM: {}", x))?;

        Ok(pem)
    }

    #[test]
    fn test_verify_with_correct_key() {
        let correct_key = extract_verifying_key_as_pem(example_presentation())
            .expect("Failed to extract verifying key from presentation");

        let (sent, recv, time) =
            verify_presentation(example_presentation(), correct_key).unwrap();

        assert_eq!(1748415894, time);
        assert!(sent.contains("host: raw.githubusercontent.com"));
        assert!(sent.contains("XXXXXXXXXXXXXXXXXX"));
        assert!(recv.contains("HTTP/1.1 200 OK"));
        assert!(recv.contains("Content-Type: text/plain"));
    }

    #[test]
    fn test_verify_with_your_current_key() {
        let your_notary_key = String::from(
"-----BEGIN PUBLIC KEY-----
MDYwEAYHKoZIzj0CAQYFK4EEAAoDIgACWq2qrz9HJbTB32D4WowdXQfnCaBS5eas
rPwHd4svpUo=
-----END PUBLIC KEY-----"
        );

        let res = verify_presentation(example_presentation(), your_notary_key);

        assert_eq!(
            res,
            Err("The verifying key does not match the notary key".to_string())
        );
    }

    #[test]
    fn test_verify_wrong_key() {
        let invalid_key = String::from(
"-----BEGIN PUBLIC KEY-----
MDYwEAYHKoZIzj0CAQYFK4EEAAoDIgABm3AS+GGr3gEwbDOWNJTR7oWF/xJ6LBf+
z9KxqnGiW9o=
-----END PUBLIC KEY-----"
        );

        let res = verify_presentation(example_presentation(), invalid_key);

        assert!(res.is_err());
        let error_msg = res.unwrap_err();
        assert!(error_msg.contains("Invalid notary key") || error_msg.contains("does not match"));
    }
}
