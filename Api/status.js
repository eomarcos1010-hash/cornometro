export default function handler(req, res) {
    const configurada = !!process.env.GEMINI_API_KEY;

    res.status(200).json({
        online: configurada
    });
}