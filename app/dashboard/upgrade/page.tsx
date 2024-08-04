'use client';

import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs";
import { CheckIcon } from "lucide-react"

function PricingPage() {
    const { user } = useUser();
    return (
        <div>
            <div className="py-24 sm:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Supercharge your document companion</p>
                </div>
                <p className="mx-auto mt-6 max-w-2xl px-10 text-center text-lg leading-8 text-gray-600">
                    Choose an affordable plan thats packed with the best features for interacing with your PDFs, enhancing productivity, and streamlining your workflow.
                </p>

                <div className="max-w-md mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 md:max-w-2xl gap-8 lg:max-w-4xl">
                    {/* FREE */}
                    <div className="ring-1 ring-gray-200 p-8 h-fit pb-12 rounded-3xl">
                        <h3 className="text-lg font-semibold leading-8 text-gray-900">Starter Plan</h3>
                        <p className="mt-4 text-sm leading-6 text-gray-600">Explore Core Features at No Cost</p>
                        <p className="mt-6 flex items-baseline gap-x-1">
                            <span className="text-4xl font-bold tracking-tight text-gray-900">Free</span>
                        </p>
                        <ul role="list" className="mt-8 text-sm space-y-3 leading-6 text-gray-600">
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                5 Documents
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Upto 10 messages per document
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Try out AI Chat Functionality
                            </li>
                        </ul>
                    </div>
                    {/* PRO */}
                    <div className="ring-2 ring-indigo-600 p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold leading-8 text-indigo-600">Pro Plan</h3>
                        <p className="mt-4 text-sm leading-6 text-gray-600">Maximize Productivity with PRO Features</p>
                        <p className="flex items-baseline gap-x-1">
                            <span className="text-4xl font-bold tracking-tight text-gray-900">$5.99</span>
                            <span className="text-sm font-semibold leading-6 text-gray-600">/ month</span>
                        </p>
                        <Button className="bg-indigo-600 w-full text-white shadow-sm hover:bg-indigo-500 mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Upgrade to Pro</Button>
                        <ul role="list" className="mt-8 text-sm space-y-3 leading-6 text-gray-600">
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Store upto 20 Documents
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Ability to Delete Documents
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Upto 100 messages per document
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Full power AI Chat Functionality with Memory Recall
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                Advanced analytics
                            </li>
                            <li className="flex gap-3">
                                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                                24-hour support response time
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default PricingPage