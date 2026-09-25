
// LiveKit session report received
// {
//   headers: {
//     accept: '*/*',
//     'accept-encoding': 'gzip, deflate',
//     'accept-language': '*',
//     connection: 'keep-alive',
//     'content-length': '9925',
//     'content-type': 'application/json',
//     host: 'localhost:3000',
//     'sec-fetch-mode': 'cors',
//     'user-agent': 'node',
//     'x-forwarded-for': '::1',
//     'x-forwarded-host': 'localhost:3000',
//     'x-forwarded-port': '3000',
//     'x-forwarded-proto': 'http'
//   },
//   body: {
//     agentId: 'cmtsm3f05000beew2z65tit98',
//     report: {
//       job_id: 'AJ_wHH3Vu2p9Sev',
//       room_id: 'RM_WJczvLRBMmuf',
//       room: 'call-9940d469-50b2-4710-aa31-29319691e40e',
//       events: [],
//       audio_recording_path: null,
//       audio_recording_started_at: null,
//       options: {
//         allow_interruptions: true,
//         discard_audio_if_uninterruptible: true,
//         min_interruption_duration: 500,
//         min_interruption_words: 0,
//         min_endpointing_delay: 300,
//         max_endpointing_delay: 2500,
//         max_tool_steps: 3,
//         user_away_timeout: 15,
//         preemptive_generation: {
//           enabled: false,
//           preemptiveTts: false,
//           maxSpeechDuration: 10000,
//           maxRetries: 3
//         },
//         recording_options: {
//           audio: false,
//           traces: true,
//           logs: true,
//           transcript: true,
//           redaction: false
//         }
//       },
//       chat_history: {
//         items: [
//           {
//             id: 'item_d52907d7-c92',
//             type: 'agent_handoff',
//             new_agent_id: 'default_agent',
//             created_at: 1790069308.256
//           },
//           {
//             id: 'item_c3bac9ea-a4d',
//             type: 'agent_config_update',
//             instructions: ' \n' +
//               '      ## Role\n' +
//               '\n' +
//               'You are Riley, an event coordinator for {{company}}. You make outbound reminder calls to registered attendees for {{event_name}}.\n' +
//               '\n' +
//               '## Objective\n' +
//               '\n' +
//               'Confirm attendance, handle rescheduling or cancellations, share event logistics, and escalate special requests.\n' +
//               '\n' +
//               '## Call Flow Overview\n' +
//               '\n' +
//               'Greet the registrant, confirm whether they plan to attend, then handle their response by confirming attendance, offering alternatives, processing cancellations, or sharing event logistics.\n' +
//               '\n' +
//               '## Call Flow\n' +
//               '\n' +
//               '### Step 1: Confirm Attendance\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "Are you still planning to attend?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               '### Step 2: Handle Based on Response\n' +
//               '\n' +
//               '#### Step 2.1: If Attending\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "Great! Let me confirm your attendance right now."\n' +
//               '\n' +
//               'Call `confirm_attendant`.\n' +
//               '\n' +
//               'If `confirm_attendant` succeeds, provide a natural variation of:\n' +
//               '\n' +
//               '> "The event is on {{date}} at {{time}} {{timezone}}. Your access link will be emailed before the event. Is there anything else you need?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'If there are no further questions, proceed to Step 5.\n' +
//               '\n' +
//               'If `confirm_attendant` fails, respond exactly with:\n' +
//               '\n' +
//               '> "I was unable to confirm your attendance in our system right now, but your registration is still active. Let me share the event details with you."\n' +
//               '\n' +
//               'Provide a natural variation of:\n' +
//               '\n' +
//               '> "The event is on {{date}} at {{time}} {{timezone}}. Your access link will be emailed before the event. Is there anything else you need?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               '#### Step 2.2: If Not Attending\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "We have another session on {{next_date}}. Would you like me to move your registration to that one?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'If the registrant wants to move to the next session, proceed to Step 3.\n' +
//               '\n' +
//               'If the registrant does not want to reschedule, proceed to Step 4.\n' +
//               '\n' +
//               '### Step 3: Change Registration to Next Session\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "One moment while I update your registration."\n' +
//               '\n' +
//               'Call `change_registration`.\n' +
//               '\n' +
//               'If `change_registration` succeeds, respond exactly with:\n' +
//               '\n' +
//               '> "Your registration has been successfully moved to the new session. You will receive an updated confirmation email shortly. Is there anything else I can help you with?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'Proceed to Step 5.\n' +
//               '\n' +
//               'If `change_registration` fails, respond exactly with:\n' +
//               '\n' +
//               '> "I am sorry, I was unable to update your registration at this time. Please visit our website or reply to your confirmation email to make the change manually. I apologize for the inconvenience."\n' +
//               '\n' +
//               'Proceed to Step 5.\n' +
//               '\n' +
//               '### Step 4: Cancel Registration\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "Just to confirm, you would like to cancel your registration for {{event_name}} on {{date}}. Is that correct?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'If the registrant confirms cancellation:\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "Give me just a moment to process your cancellation."\n' +
//               '\n' +
//               'Call `unregister_attendant`.\n' +
//               '\n' +
//               'If `unregister_attendant` succeeds, provide a natural variation of:\n' +
//               '\n' +
//               '> "Your registration has been cancelled. We are sorry you will not be able to make it. If you change your mind or would like to join a future event, you are always welcome to re-register. Is there anything else I can help you with?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'Call `end_call`.\n' +
//               '\n' +
//               'If `unregister_attendant` fails, respond exactly with:\n' +
//               '\n' +
//               '> "I am sorry, I was unable to cancel your registration at this time. Please reply to your confirmation email or visit our website to complete the cancellation. I apologize for the inconvenience."\n' +
//               '\n' +
//               'Call `end_call`.\n' +
//               '\n' +
//               'If the registrant changes their mind and does not want to cancel, return to Step 2.2.\n' +
//               '\n' +
//               '### Step 5: Wrap Up\n' +
//               '\n' +
//               'Respond exactly with:\n' +
//               '\n' +
//               '> "Thanks for your time. We look forward to the event. Have a wonderful day."\n' +
//               '\n' +
//               'Call `end_call`.\n' +
//               '\n' +
//               '## Escalation Rules\n' +
//               '\n' +
//               'If the registrant has technical issues joining, speaker or sponsorship inquiries, or refund requests, respond exactly with:\n' +
//               '\n' +
//               '> "Let me connect you with the appropriate team to help with that."\n' +
//               '\n' +
//               'Call `transfer_call`.\n' +
//               '\n' +
//               'If the transfer fails, respond exactly with:\n' +
//               '\n' +
//               '> "I apologize, the team is not available right now. Can I take your contact info for a callback?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'Call `end_call`.\n' +
//               '\n' +
//               '## Step 6: Answer Registrant Questions\n' +
//               '\n' +
//               "Listen to the registrant's question and match it to the **FAQ Knowledge Base** below.\n" +
//               '\n' +
//               'Provide a natural variation of the matching FAQ answer. Do not read the answer verbatim — adapt it for a conversational voice response.\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'After answering, provide a natural variation of:\n' +
//               '\n' +
//               '> "Is there anything else I can help you with?"\n' +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'If the registrant has another question, repeat Step 6.\n' +
//               '\n' +
//               '## Out Of Knowledge Handling\n' +
//               '\n' +
//               'If the registrant asks a question that is **not covered** in the FAQ Knowledge Base, respond exactly with:\n' +
//               '\n' +
//               `> "That's a great question. This request needs assistance from another department. I can help connect you with the appropriate team. Is there anything else I can help you with before transferring you?"\n` +
//               '\n' +
//               '<*Wait for customer response*>\n' +
//               '\n' +
//               'Do **not** attempt to answer questions outside the FAQ Knowledge Base.\n' +
//               '\n' +
//               '## FAQ Knowledge Base\n' +
//               '\n' +
//               '---\n' +
//               '\n' +
//               '### Event Date and Time\n' +
//               '\n' +
//               '**Q: When is the event?**\n' +
//               '\n' +
//               'A: {{date}} at {{time}} {{timezone}}.\n' +
//               '\n' +
//               '### How to Join\n' +
//               '\n' +
//               '**Q: How do I join the event?**\n' +
//               '\n' +
//               'A: An access link will be emailed before the event.\n' +
//               '\n' +
//               '### Recording\n' +
//               '\n' +
//               '**Q: Will there be a recording?**\n' +
//               '\n' +
//               'A: Yes, it will be sent within 48 hours after the event.\n' +
//               '\n' +
//               '### Switching Sessions\n' +
//               '\n' +
//               '**Q: Can I switch to a different session?**\n' +
//               '\n' +
//               'A: Yes, I can move your registration to the next available session.\n' +
//               '\n' +
//               '---\n' +
//               '\n' +
//               '## Guidelines\n' +
//               '\n' +
//               '- Keep responses short and conversational.\n' +
//               '## Hold / Pause Handling\n' +
//               'If you are told:\n' +
//               '• "Hold on"\n' +
//               '• "One moment"\n' +
//               '• "Please wait"\n' +
//               '• Or similar\n' +
//               'You must respond with exactly:\n' +
//               'NO_RESPONSE_NEEDED\n' +
//               '\n' +
//               '- If the customer says goodbye or indicates the conversation is over, call `end_call`.\n' +
//               '      Always respond in hi-IN.',
//             tools_added: [
//               'end_call',
//               'check_availability',
//               'book_appointment',
//               'code_tool',
//               'confirm_attendant',
//               'unregister_attendant',
//               'change_registration',
//               'send_student_details',
//               'transfer_call_warm',
//               'press_digit'
//             ],
//             created_at: 1790069308.263
//           },
//           {
//             id: 'item_511b49ef-234',
//             type: 'message',
//             role: 'assistant',
//             content: [
//               'नमस्ते! क्या आप अभी भी इवेंट में शामिल होने का प्लान कर रहे हैं? '
//             ],
//             interrupted: false,
//             created_at: 1790069310.658,
//             metrics: {
//               llm_node_ttft: 1.0400941670000003,
//               tts_node_ttfb: 0.2808982919999998,
//               started_speaking_at: 1790069313.525,
//               stopped_speaking_at: 1790069317.842,
//               playback_latency: 1.188
//             }
//           },
//           {
//             id: 'item_79b4feca-655',
//             type: 'message',
//             role: 'user',
//             content: [ 'End call to' ],
//             interrupted: false,
//             created_at: 1790069317.85,
//             transcript_confidence: 0.91259766,
//             metrics: {
//               started_speaking_at: 1790069311.469393,
//               stopped_speaking_at: 1790069313.2678394,
//               transcription_delay: 4.57916064453125,
//               end_of_turn_delay: 4.58216064453125,
//               on_user_turn_completed_delay: 0.001
//             }
//           },
//           {
//             id: 'item_1d50af96-686/fnc_0',
//             type: 'function_call',
//             call_id: 'call_FW8pbBUzBYziDxB6Xwow0Kk0',
//             name: 'end_call',
//             arguments: '{}',
//             created_at: 1790069318.843
//           },
//           {
//             id: 'item_b843dde4-03b',
//             type: 'function_call_output',
//             name: 'end_call',
//             call_id: 'call_FW8pbBUzBYziDxB6Xwow0Kk0',
//             output: '"Briefly thank the user and say goodbye."',
//             is_error: false,
//             created_at: 1790069318.845
//           },
//           {
//             id: 'item_ae5384fb-bdd',
//             type: 'message',
//             role: 'assistant',
//             content: [
//               'आपका समय देने के लिए धन्यवाद। हम इवेंट में मिलने की उम्मीद करते हैं। आपका दिन शुभ हो! '
//             ],
//             interrupted: false,
//             created_at: 1790069319.23,
//             metrics: {
//               llm_node_ttft: 0.8174088340000001,
//               tts_node_ttfb: 0.2939044589999984,
//               started_speaking_at: 1790069321.156,
//               stopped_speaking_at: 1790069326.52,
//               playback_latency: 0,
//               e2e_latency: 7.888160467147827
//             }
//           }
//         ]
//       },
//       enable_user_data_training: true,
//       timestamp: 1790069328775,
//       usage: [
//         {
//           type: 'llm_usage',
//           provider: 'unknown',
//           model: 'gpt-4.1',
//           input_tokens: 5859,
//           output_tokens: 61
//         },
//         {
//           type: 'tts_usage',
//           provider: 'ElevenLabs',
//           model: 'eleven_flash_v2_5',
//           characters_count: 149,
//           audio_duration: 9.041
//         },
//         {
//           type: 'stt_usage',
//           provider: 'Deepgram',
//           model: 'nova-3',
//           audio_duration: 2.9
//         },
//         {
//           type: 'eot_usage',
//           provider: 'livekit',
//           model: 'turn-detector-v1',
//           total_requests: 1
//         }
//       ],
//       sdk_version: '1.8.1'
//     },
//   }
// }
