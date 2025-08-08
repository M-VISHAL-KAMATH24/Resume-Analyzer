import React from 'react'
import { useState } from 'react';
import Navbar from '~/components/Navbar'
import FileUploader from './FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from 'constants/index';

const upload = () => {
    const {auth,isLoading,fs,ai,kv}=usePuterStore();
    const navigate=useNavigate();
    const [isProcessing,setIsProcessing]=useState(false);
    const [statusText,setStatusText]=useState('');
    const [file,setFile]=useState<File|null>(null)
    const handleFileSelect=(file:File|null)=>{
        setFile(file);
    }
    const handleAnalyze=async({companyName,jobTitle,jobDescription,file}:{companyName:string,jobTitle:string,jobDescription:string,file:File})=>{
        setIsProcessing(true);
        setStatusText('uploading the file...');
        const uploadedFile=await fs.upload([file]);
        if (!uploadedFile) return setStatusText('error:failed to upload the file')
            setStatusText('converting to image');
        const imageFile=await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText('cannot convert the pdf to image')
            setStatusText('uploading the image')
        const uploadedImage=await fs.upload([imageFile.file]);
        if(!uploadedImage)
            return setStatusText('error failed to upload teh image');
        setStatusText('preparing the data...')
        const uuid=generateUUID();
        const data={
            id:uuid,resumePath:uploadedFile.path,
            imagePath:uploadedImage.path,
            companyName,jobTitle,jobDescription,
            feedback:'',
        }
        await kv.set(`resume:${uuid}`,JSON.stringify(data));
        setStatusText('Analyzing...')
        const feedback=await ai.feedback(
            uploadedFile.path,
            prepareInstructions({jobTitle,jobDescription})
        )
        if(!feedback) return setStatusText('error failed to analyze the resume')
            const feedbackText=typeof feedback.message.content==='string'
        ?feedback.message.content:feedback.message.content[0].text;
        data.feedback=JSON.parse(feedbackText)
        await kv.set(`resume:${uuid}`,JSON.stringify(data));
        setStatusText('Analysis complete. redirecting...')
        console.log(data);
        navigate(`/resume/${uuid}`)
    }
    const handleSubmit=(e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        const form=e.currentTarget.closest('form');
        if(!form) return;
        const formData=new FormData(form);
        const companyName=formData.get('company-name') as string;
        const jobTitle=formData.get('jobtitle-name') as string;
        const jobDescription=formData.get('job-description') as string;
        if(!file) return;
        handleAnalyze({companyName,jobTitle,jobDescription,file});

    }
  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover">
    <Navbar/>
    <section className='main-section'>
        <div className='page-heading py-16'>
            <h1>
                smart feedback for your dream job
            </h1>
            {isProcessing?(
                <>
                <h2>{statusText}</h2>
                <img src="/images/resume-scan.gif"className='w-full' alt="hiiii" />
                </>
            ):(
                <h2>drop your resume for an ATS score system</h2>
            )}
            {!isProcessing &&(
                <form id="upload-form" onSubmit={handleSubmit} className='flex flex-gap gap-4 mt-8'>
                    <div className='form-div'>
                        <label htmlFor="company-name">Company name</label>
                        <input type="text" name='company-name' placeholder='Company name' id='company-name' />
                    </div>
                    <div className='form-div'>
                        <label htmlFor="job-title">Job title </label>
                        <input type="text" name='job-title' placeholder='job title' id='job-title' />
                    </div>
                    <div className='form-div'>
                        <label htmlFor="job-description">Job description </label>
                       <textarea rows={5} name="job-description" id="" placeholder='job description'></textarea>
                    </div>
                    <div className='form-div'>
                        <label htmlFor="uploader">Upload Resume</label>
                        <FileUploader onFileSelect={handleFileSelect}/>
                       
                            <button className='primary-button' type="submit">
                                analyze resume
                            </button>
                        
                    </div>

                </form>
            )}
        </div>
    </section>
    </main>
  )
}

export default upload