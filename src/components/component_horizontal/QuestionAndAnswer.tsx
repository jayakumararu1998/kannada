import type { StandardNewsProps } from "@/components/news-props";
import { cn } from "@/lib/utils";

type Props = StandardNewsProps;

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-[52px] w-[52px] shrink-0", className)}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 25.875C0 11.5846 11.5846 0 25.875 0C40.1654 0 51.75 11.5846 51.75 25.875V46.8679C51.75 49.5642 49.5642 51.75 46.8679 51.75H25.875C11.5846 51.75 0 40.1654 0 25.875Z"
        fill="#009EF9"
      />
      <path
        d="M33.255 37.2L27.09 31.065L29.355 28.8L35.49 34.935L33.255 37.2ZM25.485 37.2C23.325 37.2 21.475 36.73 19.935 35.79C18.395 34.84 17.21 33.52 16.38 31.83C15.56 30.14 15.15 28.18 15.15 25.95C15.15 23.72 15.56 21.76 16.38 20.07C17.21 18.38 18.395 17.065 19.935 16.125C21.475 15.175 23.325 14.7 25.485 14.7C27.645 14.7 29.495 15.175 31.035 16.125C32.585 17.065 33.77 18.38 34.59 20.07C35.42 21.76 35.835 23.72 35.835 25.95C35.835 28.18 35.42 30.14 34.59 31.83C33.77 33.52 32.585 34.84 31.035 35.79C29.495 36.73 27.645 37.2 25.485 37.2ZM25.485 33.795C26.935 33.805 28.14 33.485 29.1 32.835C30.07 32.185 30.795 31.27 31.275 30.09C31.765 28.91 32.01 27.53 32.01 25.95C32.01 24.37 31.765 23 31.275 21.84C30.795 20.67 30.07 19.76 29.1 19.11C28.14 18.46 26.935 18.125 25.485 18.105C24.035 18.095 22.83 18.415 21.87 19.065C20.91 19.715 20.185 20.63 19.695 21.81C19.215 22.99 18.975 24.37 18.975 25.95C18.975 27.53 19.215 28.905 19.695 30.075C20.175 31.235 20.895 32.14 21.855 32.79C22.825 33.44 24.035 33.775 25.485 33.795Z"
        fill="white"
      />
    </svg>
  );
}

function AnswerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-[52px] w-[52px] shrink-0", className)}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 25.875C0 11.5846 11.5846 0 25.875 0H49.2049C50.6105 0 51.75 1.13947 51.75 2.54508V25.875C51.75 40.1654 40.1654 51.75 25.875 51.75C11.5846 51.75 0 40.1654 0 25.875Z"
        fill="#0D156C"
      />
      <path
        d="M17.85 36.75L24.66 15.15H29.955L36.765 36.75H33.045L26.865 17.37H27.675L21.57 36.75H17.85ZM21.645 32.07V28.695H32.985V32.07H21.645Z"
        fill="white"
      />
    </svg>
  );
}

export default function QuestionAndAnswer({
  className,
  title = {
    hidden: false,
    value:
      "ಬೆಂಗಳೂರು: ಮುಖ್ಯಮಂತ್ರಿ ಡಿಕೆ ಶಿವಕುಮಾರ್ ಅವರು ರಾಜ್ಯದ ಸಚಿವರಿಗೆ ಮಳೆಗಾಲದ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಮತ್ತು ಪ್ರವಾಹ ನಿರ್ವಹಣೆಗೆ ತಾತ್ಕಾಲಿಕ ಜಿಲ್ಲಾ ಉಸ್ತುವಾರಿ ಜವಾಬ್ದಾರಿ ಹಂಚಿಕೆ ಮಾಡಿದ್ದಾರೆ.",
  },
  excerpt = {
    hidden: false,
    value:
      "ಹೌದು.. ರಾಜ್ಯದ ಆಡಳಿತ ವ್ಯವಸ್ಥೆಯನ್ನು ಚುರುಕುಗೊಳಿಸುವ ಹಾಗೂ ಜಿಲ್ಲಾ ಮಟ್ಟದ ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿಗಳಿಗೆ ವೇಗ ನೀಡುವ ನಿಟ್ಟಿನಲ್ಲಿ ಮತ್ತು ಪ್ರಮುಖವಾಗಿ ಪ್ರಕೃತಿ ವಿಕೋಪದ ಸಂದರ್ಭದಲ್ಲಿ ಜಿಲ್ಲಾಡಳಿತದೊಂದಿಗೆ ಸಮನ್ವಯ ಸಾಧಿಸಲು ಮುಖ್ಯಮಂತ್ರಿ ಡಿಕೆ ಶಿವಕುಮಾರ್ ಅವರು ಮಹತ್ವದ ಕ್ರಮ ಕೈಗೊಂಡಿದ್ದಾರೆ.",
  },
}: Props) {
  return (
    <article
      className={cn(
        "flex w-full flex-col gap-7 bg-transparent px-4 py-5 sm:gap-9 sm:px-6 sm:py-7",
        className,
      )}
    >
      {!title.hidden && title.value && (
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-3.5 sm:gap-x-[26px]">
          <QuestionIcon />

          <div className="flex flex-col gap-5 sm:gap-[26px]">
            <p
              className={cn(
                "m-0 text-16-manrope-700 leading-128 tracking-[0] text-333333 [overflow-wrap:anywhere]",
                title.customClass,
              )}
            >
              {title.value}
            </p>
          </div>
        </div>
      )}

      {!excerpt.hidden && excerpt.value && (
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-3.5 sm:gap-x-[26px]">
          <AnswerIcon />

          <div className="flex flex-col gap-5 sm:gap-[26px]">
            <p
              className={cn(
                "m-0 text-16-manrope-400 leading-128 tracking-[0] text-333333 [overflow-wrap:anywhere]",
                excerpt.customClass,
              )}
            >
              {excerpt.value}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
